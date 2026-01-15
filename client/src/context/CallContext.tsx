import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';

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

	// Cleanup function for ending calls
	const cleanup = useCallback(() => {
		if (localStream) {
			for (const track of localStream.getTracks()) {
				track.stop();
			}
		}
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}
		pendingIceCandidatesRef.current = [];
		setLocalStream(null);
		setRemoteStream(null);
		setCallState(initialCallState);
		setIncomingCallData(null);
	}, [localStream]);

	// Create peer connection
	const createPeerConnection = useCallback(() => {
		const pc = new RTCPeerConnection(ICE_SERVERS);

		pc.onicecandidate = (event) => {
			if (event.candidate && socket) {
				socket.emit('ice-candidate', {
					candidate: event.candidate,
					to: callState.remoteUser?.id || incomingCallData?.from.id,
				});
			}
		};

		pc.ontrack = (event) => {
			const [stream] = event.streams;
			setRemoteStream(stream);
		};

		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
				cleanup();
			}
		};

		peerConnectionRef.current = pc;
		return pc;
	}, [socket, callState.remoteUser?.id, incomingCallData?.from.id, cleanup]);

	// Get user media
	const getUserMedia = async (isVideo: boolean): Promise<MediaStream> => {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: isVideo,
			audio: true,
		});
		return stream;
	};

	// Start a call (caller side)
	const startCall = async (channelId: string, remoteUser: CallUser, isVideo: boolean) => {
		if (!socket || !isConnected) {
			console.error('Socket not connected');
			return;
		}

		try {
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

			const pc = createPeerConnection();

			// Add local stream tracks to peer connection
			for (const track of stream.getTracks()) {
				pc.addTrack(track, stream);
			}

			// Create and send offer
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			socket.emit('call-request', {
				to: remoteUser.id,
				from: currentUser,
				channelId,
				callType: isVideo ? 'video' : 'audio',
				offer,
			});
		} catch (error) {
			console.error('Error starting call:', error);
			cleanup();
		}
	};

	// Accept an incoming call
	const acceptCall = async () => {
		if (!socket || !incomingCallData) return;

		try {
			const isVideo = incomingCallData.callType === 'video';
			const stream = await getUserMedia(isVideo);
			setLocalStream(stream);

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

			const pc = peerConnectionRef.current;
			if (!pc) return;

			// Add local stream tracks
			for (const track of stream.getTracks()) {
				pc.addTrack(track, stream);
			}

			// Process any pending ICE candidates
			for (const candidate of pendingIceCandidatesRef.current) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			}
			pendingIceCandidatesRef.current = [];

			// Create and send answer
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			socket.emit('call-answer', {
				to: incomingCallData.from.id,
				answer,
			});

			setIncomingCallData(null);
		} catch (error) {
			console.error('Error accepting call:', error);
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
		if (socket && (callState.remoteUser || incomingCallData?.from)) {
			socket.emit('call-ended', {
				to: callState.remoteUser?.id || incomingCallData?.from.id,
			});
		}
		cleanup();
	}, [socket, callState.remoteUser, incomingCallData?.from, cleanup]);

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
			// If already in a call, reject automatically
			if (callState.isInCall || callState.isCalling) {
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
			const pc = createPeerConnection();
			await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
		};

		// Handle call answer
		const handleCallAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
			const pc = peerConnectionRef.current;
			if (!pc) return;

			await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

			setCallState((prev) => ({
				...prev,
				isInCall: true,
				isCalling: false,
			}));
		};

		// Handle ICE candidate
		const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
			const pc = peerConnectionRef.current;
			if (pc && pc.remoteDescription) {
				await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
			} else {
				// Queue the candidate if remote description isn't set yet
				pendingIceCandidatesRef.current.push(data.candidate);
			}
		};

		// Handle call rejection
		const handleCallRejected = () => {
			cleanup();
		};

		// Handle call ended
		const handleCallEnded = () => {
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
