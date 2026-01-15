import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';
import { logger } from '../lib/logger';

export interface CallUser {
	id: string;
	username: string;
	avatar?: string;
}

export interface CallState {
	isInCall: boolean;
	isVideoEnabled: boolean;
	isAudioEnabled: boolean;
	isCalling: boolean;
	isReceivingCall: boolean;
	callType: 'audio' | 'video' | null;
	remoteUser: CallUser | null;
	channelId: string | null;
}

interface CallContextType {
	callState: CallState;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	startCall: (channelId: string, remoteUser: CallUser, isVideo: boolean) => Promise<void>;
	acceptCall: () => Promise<void>;
	rejectCall: () => void;
	endCall: () => void;
	toggleVideo: () => void;
	toggleAudio: () => void;
	incomingCallData: {
		from: CallUser;
		channelId: string;
		callType: 'audio' | 'video';
	} | null;
}

const initialCallState: CallState = {
	isInCall: false,
	isVideoEnabled: true,
	isAudioEnabled: true,
	isCalling: false,
	isReceivingCall: false,
	callType: null,
	remoteUser: null,
	channelId: null,
};

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
	const context = useContext(CallContext);
	if (!context) {
		throw new Error('useCall must be used within a CallProvider');
	}
	return context;
};

// Free STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
		{ urls: 'stun:stun2.l.google.com:19302' },
	],
};

interface CallProviderProps {
	children: React.ReactNode;
	currentUser: CallUser;
}

export const CallProvider = ({ children, currentUser }: CallProviderProps) => {
	const { socket, isConnected } = useSocket();
	const [callState, setCallState] = useState<CallState>(initialCallState);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const [incomingCallData, setIncomingCallData] = useState<{
		from: CallUser;
		channelId: string;
		callType: 'audio' | 'video';
	} | null>(null);

	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
	// Use a ref to track the target user ID for ICE candidates - this avoids stale closure issues
	const targetUserIdRef = useRef<string | null>(null);
	// Use a ref to accumulate remote tracks into a single MediaStream
	const remoteStreamRef = useRef<MediaStream | null>(null);

	// Cleanup function for ending calls
	const cleanup = useCallback(() => {
		// Stop all local tracks
		if (localStream) {
			for (const track of localStream.getTracks()) {
				track.stop();
			}
		}
		// Close peer connection
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}
		pendingIceCandidatesRef.current = [];
		targetUserIdRef.current = null;
		remoteStreamRef.current = null;
		setLocalStream(null);
		setRemoteStream(null);
		setCallState(initialCallState);
		setIncomingCallData(null);
	}, [localStream]);

	// Create peer connection
	const createPeerConnection = useCallback((targetUserId: string) => {
		logger.debug('[WebRTC] Creating peer connection for target:', { targetUserId });
		
		// Store target user ID in ref for later use
		targetUserIdRef.current = targetUserId;
		
		// Create a new MediaStream for remote tracks
		remoteStreamRef.current = new MediaStream();
		
		const pc = new RTCPeerConnection(ICE_SERVERS);

		pc.onicecandidate = (event) => {
			if (event.candidate && socket && targetUserIdRef.current) {
				logger.debug('[WebRTC] Sending ICE candidate to:', { targetUserId: targetUserIdRef.current });
				socket.emit('ice-candidate', {
					candidate: event.candidate,
					to: targetUserIdRef.current,
				});
			}
		};

		pc.ontrack = (event) => {
			logger.info('[WebRTC] Received remote track:', { kind: event.track.kind, readyState: event.track.readyState });
			
			// Add the track to our remote stream
			if (remoteStreamRef.current) {
				// Check if track already exists to avoid duplicates
				const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === event.track.id);
				if (!existingTrack) {
					remoteStreamRef.current.addTrack(event.track);
					logger.info('[WebRTC] Added track to remote stream', { trackCount: remoteStreamRef.current.getTracks().length });
					
					// Create a new MediaStream with all the tracks to force React to detect the change
					const newStream = new MediaStream(remoteStreamRef.current.getTracks());
					remoteStreamRef.current = newStream;
					setRemoteStream(newStream);
				}
			}
			
			// Also log if the event has streams (for debugging)
			if (event.streams.length > 0) {
				logger.debug('[WebRTC] Event also has streams', { count: event.streams.length });
			}
		};

		pc.oniceconnectionstatechange = () => {
			logger.debug('[WebRTC] ICE connection state:', { state: pc.iceConnectionState });
			if (pc.iceConnectionState === 'connected') {
				logger.info('[WebRTC] ICE connection established!');
			}
			if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
				logger.warn('[WebRTC] Connection lost, cleaning up');
				cleanup();
			}
		};

		pc.onconnectionstatechange = () => {
			logger.debug('[WebRTC] Connection state:', { state: pc.connectionState });
		};

		pc.onsignalingstatechange = () => {
			logger.debug('[WebRTC] Signaling state:', { state: pc.signalingState });
		};

		peerConnectionRef.current = pc;
		return pc;
	}, [socket, cleanup]);

	// Get user media
	const getUserMedia = async (isVideo: boolean): Promise<MediaStream> => {
		logger.debug('[WebRTC] Getting user media', { isVideo });
		const stream = await navigator.mediaDevices.getUserMedia({
			video: isVideo,
			audio: true,
		});
		logger.info('[WebRTC] Got local stream', { tracks: stream.getTracks().length });
		return stream;
	};

	// Start a call (caller side)
	const startCall = async (channelId: string, remoteUser: CallUser, isVideo: boolean) => {
		if (!socket || !isConnected) {
			logger.error('[WebRTC] Socket not connected');
			return;
		}

		try {
			logger.info('[WebRTC] Starting call to:', { username: remoteUser.username, video: isVideo });
			
			const stream = await getUserMedia(isVideo);
			setLocalStream(stream);

			setCallState({
				isInCall: false,
				isVideoEnabled: isVideo,
				isAudioEnabled: true,
				isCalling: true,
				isReceivingCall: false,
				callType: isVideo ? 'video' : 'audio',
				remoteUser,
				channelId,
			});

			const pc = createPeerConnection(remoteUser.id);

			// Add local stream tracks to peer connection
			for (const track of stream.getTracks()) {
				logger.debug('[WebRTC] Adding local track:', { kind: track.kind });
				pc.addTrack(track, stream);
			}

			// Create and send offer
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			logger.info('[WebRTC] Created offer, sending to:', { userId: remoteUser.id });

			socket.emit('call-request', {
				to: remoteUser.id,
				from: currentUser,
				channelId,
				callType: isVideo ? 'video' : 'audio',
				offer,
			});
		} catch (error) {
			logger.error('[WebRTC] Error starting call:', error);
			cleanup();
		}
	};

	// Accept an incoming call
	const acceptCall = async () => {
		if (!socket || !incomingCallData) {
			logger.error('[WebRTC] Cannot accept call - no socket or incoming call data');
			return;
		}

		const pc = peerConnectionRef.current;
		if (!pc) {
			logger.error('[WebRTC] Cannot accept call - no peer connection');
			return;
		}

		try {
			logger.info('[WebRTC] Accepting call from:', { username: incomingCallData.from.username });
			
			const isVideo = incomingCallData.callType === 'video';
			const stream = await getUserMedia(isVideo);
			setLocalStream(stream);

			// Add local stream tracks to peer connection
			for (const track of stream.getTracks()) {
				logger.debug('[WebRTC] Adding local track:', { kind: track.kind });
				pc.addTrack(track, stream);
			}

			// Process any pending ICE candidates
			logger.debug('[WebRTC] Processing pending ICE candidates', { count: pendingIceCandidatesRef.current.length });
			for (const candidate of pendingIceCandidatesRef.current) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			}
			pendingIceCandidatesRef.current = [];

			// Create and send answer
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			logger.info('[WebRTC] Created answer, sending to:', { userId: incomingCallData.from.id });

			socket.emit('call-answer', {
				to: incomingCallData.from.id,
				answer,
			});

			setCallState({
				isInCall: true,
				isVideoEnabled: isVideo,
				isAudioEnabled: true,
				isCalling: false,
				isReceivingCall: false,
				callType: incomingCallData.callType,
				remoteUser: incomingCallData.from,
				channelId: incomingCallData.channelId,
			});

			setIncomingCallData(null);
		} catch (error) {
			logger.error('[WebRTC] Error accepting call:', error);
			cleanup();
		}
	};

	// Reject an incoming call
	const rejectCall = useCallback(() => {
		if (!socket || !incomingCallData) return;

		socket.emit('call-rejected', {
			to: incomingCallData.from.id,
		});

		cleanup();
	}, [socket, incomingCallData, cleanup]);

	// End the current call
	const endCall = useCallback(() => {
		const targetId = targetUserIdRef.current;
		if (socket && targetId) {
			socket.emit('call-ended', {
				to: targetId,
			});
		}
		cleanup();
	}, [socket, cleanup]);

	// Toggle video
	const toggleVideo = useCallback(() => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setCallState((prev) => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
			}
		}
	}, [localStream]);

	// Toggle audio
	const toggleAudio = useCallback(() => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				setCallState((prev) => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
			}
		}
	}, [localStream]);

	// Socket event listeners
	useEffect(() => {
		if (!socket) return;

		// Handle incoming call request
		const handleCallRequest = async (data: {
			from: CallUser;
			channelId: string;
			callType: 'audio' | 'video';
			offer: RTCSessionDescriptionInit;
		}) => {
			logger.info('[WebRTC] Received call request from:', { username: data.from.username });
			
			// If already in a call, reject automatically
			if (callState.isInCall || callState.isCalling) {
				logger.info('[WebRTC] Already in call, rejecting');
				socket.emit('call-rejected', { to: data.from.id, reason: 'busy' });
				return;
			}

			setIncomingCallData({
				from: data.from,
				channelId: data.channelId,
				callType: data.callType,
			});

			setCallState((prev) => ({
				...prev,
				isReceivingCall: true,
				callType: data.callType,
			}));

			// Create peer connection and set remote description
			const pc = createPeerConnection(data.from.id);
			logger.debug('[WebRTC] Setting remote description from offer');
			await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
		};

		// Handle call answer
		const handleCallAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
			logger.info('[WebRTC] Received call answer');
			const pc = peerConnectionRef.current;
			if (!pc) {
				logger.error('[WebRTC] No peer connection to set answer on');
				return;
			}

			await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
			logger.debug('[WebRTC] Remote description set from answer');

			// Process any pending ICE candidates
			logger.debug('[WebRTC] Processing pending ICE candidates', { count: pendingIceCandidatesRef.current.length });
			for (const candidate of pendingIceCandidatesRef.current) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			}
			pendingIceCandidatesRef.current = [];

			setCallState((prev) => ({
				...prev,
				isInCall: true,
				isCalling: false,
			}));
		};

		// Handle ICE candidate
		const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
			logger.debug('[WebRTC] Received ICE candidate');
			const pc = peerConnectionRef.current;
			if (pc?.remoteDescription) {
				logger.debug('[WebRTC] Adding ICE candidate immediately');
				await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
			} else {
				// Queue the candidate if remote description isn't set yet
				logger.debug('[WebRTC] Queuing ICE candidate (no remote description yet)');
				pendingIceCandidatesRef.current.push(data.candidate);
			}
		};

		// Handle call rejection
		const handleCallRejected = (data?: { reason?: string }) => {
			logger.info('[WebRTC] Call rejected:', { reason: data?.reason });
			cleanup();
		};

		// Handle call ended
		const handleCallEnded = () => {
			logger.info('[WebRTC] Call ended by remote user');
			cleanup();
		};

		socket.on('call-request', handleCallRequest);
		socket.on('call-answer', handleCallAnswer);
		socket.on('ice-candidate', handleIceCandidate);
		socket.on('call-rejected', handleCallRejected);
		socket.on('call-ended', handleCallEnded);

		return () => {
			socket.off('call-request', handleCallRequest);
			socket.off('call-answer', handleCallAnswer);
			socket.off('ice-candidate', handleIceCandidate);
			socket.off('call-rejected', handleCallRejected);
			socket.off('call-ended', handleCallEnded);
		};
	}, [socket, callState.isInCall, callState.isCalling, createPeerConnection, cleanup]);

	// Register user for call notifications
	useEffect(() => {
		if (socket && isConnected && currentUser?.id) {
			socket.emit('register-user', { userId: currentUser.id });
		}
	}, [socket, isConnected, currentUser?.id]);

	return (
		<CallContext.Provider
			value={{
				callState,
				localStream,
				remoteStream,
				startCall,
				acceptCall,
				rejectCall,
				endCall,
				toggleVideo,
				toggleAudio,
				incomingCallData,
			}}
		>
			{children}
		</CallContext.Provider>
	);
};
