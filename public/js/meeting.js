import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, onValue } from 'firebase/database';

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
let remoteStream;

// Create or join a meeting
function createOrJoinMeeting() {
  if (meetingId) {
    joinMeeting(meetingId);
  } else {
    // Create a new meeting ID
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
      // Add the participant to the list
      if (!data.participants.includes(auth.currentUser.email)) {
        data.participants.push(auth.currentUser.email);
        set(meetingRef, data);
      }
      setupVideoStream();
    }
  });
}

// Setup video stream using WebRTC
async function setupVideoStream() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const localVideo = document.createElement('video');
  localVideo.srcObject = localStream;
  localVideo.autoplay = true;
  videoContainer.appendChild(localVideo);

  // Placeholder for WebRTC connection setup
  // You need to implement WebRTC signaling to handle remote video stream

  // For example, use Firebase Realtime Database or another signaling server
}

// Handle chat messages
sendButton.addEventListener('click', () => {
  const message = chatInput.value;
  if (message) {
    const messageRef = ref(database, 'meetings/' + meetingId + '/messages');
    set(messageRef, {
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
