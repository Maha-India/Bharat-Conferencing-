import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database';

// Firebase configuration and initialization (imported or set up elsewhere)
const auth = getAuth();
const database = getDatabase();

// DOM elements
const videoContainer = document.getElementById('video-container');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const meetingId = new URLSearchParams(window.location.search).get('meetingId');
let localStream;
let localPeerConnection;
let remotePeerConnections = {};
let dataChannel;

// Create or join a meeting
function createOrJoinMeeting() {
  if (meetingId) {
    joinMeeting(meetingId);
  } else {
    const newMeetingId = generateMeetingId();
    window.location.search = `?meetingId=${newMeetingId}`;
    set(ref(database, 'meetings/' + newMeetingId), {
      createdBy: auth.currentUser.email,
      participants: [auth.currentUser.email],
    });
    joinMeeting(newMeetingId);
  }
}

// Generate a random meeting ID
function generateMeetingId() {
  return Math.random().toString(36).substr(2, 9);
}

// Join a meeting
function joinMeeting(id) {
  const meetingRef = ref(database, 'meetings/' + id);
  
  onValue(meetingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (!data.participants.includes(auth.currentUser.email)) {
        data.participants.push(auth.currentUser.email);
        set(meetingRef, data);
      }
      setupVideoStream();
    }
  });

  const signalingRef = ref(database, 'meetings/' + id + '/signaling');
  
  onValue(signalingRef, (snapshot) => {
    snapshot.forEach(async (childSnapshot) => {
      const message = childSnapshot.val();
      if (message && message.type === 'offer') {
        await handleOffer(message.offer, message.from);
      } else if (message && message.type === 'answer') {
        await handleAnswer(message.answer, message.from);
      } else if (message && message.type === 'ice') {
        await handleIceCandidate(message.ice, message.from);
      }
    });
  });
}

// Setup video stream using WebRTC
async function setupVideoStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const localVideo = document.createElement('video');
  localVideo.srcObject = localStream;
  localVideo.autoplay = true;
  videoContainer.appendChild(localVideo);

  localPeerConnection = new RTCPeerConnection();
  
  localStream.getTracks().forEach(track => {
    localPeerConnection.addTrack(track, localStream);
  });

  localPeerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      const remoteVideo = document.createElement('video');
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      videoContainer.appendChild(remoteVideo);
    }
  };

  localPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignalingMessage('ice', event.candidate);
    }
  };

  await createAndSendOffer();
}

// Create and send an offer
async function createAndSendOffer() {
  const offer = await localPeerConnection.createOffer();
  await localPeerConnection.setLocalDescription(offer);
  sendSignalingMessage('offer', offer);
}

// Handle offer received from another peer
async function handleOffer(offer, from) {
  const peerConnection = new RTCPeerConnection();
  remotePeerConnections[from] = peerConnection;

  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      const remoteVideo = document.createElement('video');
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      videoContainer.appendChild(remoteVideo);
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignalingMessage('ice', event.candidate, from);
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendSignalingMessage('answer', answer, from);
}

// Handle answer received from another peer
async function handleAnswer(answer, from) {
  const peerConnection = remotePeerConnections[from];
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
}

// Handle ICE candidate received from another peer
async function handleIceCandidate(ice, from) {
  const peerConnection = remotePeerConnections[from];
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(ice));
  }
}

// Send a signaling message to Firebase
function sendSignalingMessage(type, payload, to) {
  const signalingRef = ref(database, 'meetings/' + meetingId + '/signaling');
  const messageRef = push(signalingRef);
  set(messageRef, {
    type,
    ...payload,
    from: auth.currentUser.email,
    to: to || null,
  });
}

// Handle chat messages
sendButton.addEventListener('click', () => {
  const message = chatInput.value;
  if (message) {
    const messageRef = ref(database, 'meetings/' + meetingId + '/messages');
    push(messageRef, {
      user: auth.currentUser.email,
      message: message,
      timestamp: Date.now(),
    });
    chatInput.value = '';
  }
});

// Listen for incoming chat messages
const messageRef = ref(database, 'meetings/' + meetingId + '/messages');
onValue(messageRef, (snapshot) => {
  chatBox.innerHTML = ''; // Clear previous messages
  snapshot.forEach((childSnapshot) => {
    const message = childSnapshot.val();
    const messageElement = document.createElement('div');
    messageElement.textContent = `${message.user}: ${message.message}`;
    chatBox.appendChild(messageElement);
  });
});

// Initialize
createOrJoinMeeting();
