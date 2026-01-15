import { Maximize2, Mic, MicOff, Minimize2, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCall } from '../context/CallContext';
import { logger } from '../lib/logger';

export function VideoCall() {
	const { callState, endCall, toggleAudio, toggleVideo, remoteStream, localStream } = useCall();

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLMediaElement | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const isVideoCall = callState.callType === 'video';

	// Attach local stream to local video element
	useEffect(() => {
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream]);

	// Use a callback ref to handle video/audio element mounting
	const [videoElState, setVideoElState] = useState<HTMLMediaElement | null>(null);
	const remoteVideoCallbackRef = useCallback((node: HTMLMediaElement | null) => {
		remoteVideoRef.current = node;
		setVideoElState(node);
	}, []);

	// Attach remote stream to video element and listen for track changes
	useEffect(() => {
		const videoEl = videoElState;
		logger.debug('[VideoCall] useEffect triggered', {
			hasVideoEl: !!videoEl,
			hasRemoteStream: !!remoteStream,
			remoteStreamTracks: remoteStream?.getTracks().length,
		});

		if (!videoEl || !remoteStream) return;

		logger.info('[VideoCall] Setting remote stream', { tracks: remoteStream.getTracks().length });
		videoEl.srcObject = remoteStream;

		// Force play in case autoplay is blocked
		videoEl.play().catch((e) => logger.warn('[VideoCall] Autoplay blocked:', e));

		// Listen for new tracks being added to the stream
		const handleTrackAdded = (event: MediaStreamTrackEvent) => {
			logger.info('[VideoCall] Track added to remote stream:', { kind: event.track.kind });
			// Re-assign srcObject to ensure video element picks up the new track
			videoEl.srcObject = remoteStream;
		};

		remoteStream.addEventListener('addtrack', handleTrackAdded);

		return () => {
			remoteStream.removeEventListener('addtrack', handleTrackAdded);
		};
	}, [remoteStream, videoElState]);

	const toggleFullscreen = async () => {
		if (!containerRef.current) return;

		if (!document.fullscreenElement) {
			await containerRef.current.requestFullscreen();
			setIsFullscreen(true);
		} else {
			await document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	if (!callState.isInCall && !callState.isCalling) {
		return null;
	}

	return (
		<div ref={containerRef} className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col">
			{/* Header */}
			<div className="absolute top-0 left-0 right-0 p-4 z-10 bg-linear-to-b from-black/70 to-transparent">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<img
							src={
								callState.remoteUser?.avatar ||
								`https://api.dicebear.com/7.x/avataaars/svg?seed=${callState.remoteUser?.username}`
							}
							alt={callState.remoteUser?.username}
							className="w-10 h-10 rounded-full border-2 border-white/30"
						/>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							<div>
								<h3 className="font-semibold text-lg drop-shadow-md">{callState.remoteUser?.username}</h3>
								<p className="text-xs text-white/80">
									{callState.isCalling ? 'Calling...' : isVideoCall ? 'Video Call' : 'Voice Call'}
								</p>
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={toggleFullscreen}
						className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
						title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
					>
						{isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
					</button>
				</div>
			</div>

			{/* Main Video Area */}
			<div className="flex-1 relative flex items-center justify-center">
				{isVideoCall ? (
					<>
						{/* Remote Video (full screen) */}
						<video ref={remoteVideoCallbackRef} autoPlay playsInline className="w-full h-full object-cover" />

						{/* Local Video (picture-in-picture) */}
						<div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
							<video
								ref={localVideoRef}
								autoPlay
								playsInline
								muted
								className={`w-full h-full object-cover ${!callState.isVideoEnabled ? 'hidden' : ''}`}
							/>
							{!callState.isVideoEnabled && (
								<div className="w-full h-full bg-gray-800 flex items-center justify-center">
									<VideoOff className="w-8 h-8 text-gray-400" />
								</div>
							)}
						</div>
					</>
				) : (
					/* Audio Call UI */
					<div className="flex flex-col items-center gap-6">
						<div className="relative">
							<img
								src={
									callState.remoteUser?.avatar ||
									`https://api.dicebear.com/7.x/avataaars/svg?seed=${callState.remoteUser?.username}`
								}
								alt={callState.remoteUser?.username}
								className="w-32 h-32 rounded-full border-4 border-green-500 shadow-xl"
							/>
							{callState.isCalling && (
								<div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping" />
							)}
						</div>
						<div className="text-center">
							<h2 className="text-2xl font-bold text-white">{callState.remoteUser?.username}</h2>
							<p className="text-gray-400 mt-1">{callState.isCalling ? 'Calling...' : 'Connected'}</p>
						</div>
						{/* Hidden audio elements */}
						<audio ref={remoteVideoCallbackRef} autoPlay className="hidden" />
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/70 to-transparent">
				<div className="flex items-center justify-center gap-4">
					{/* Mute/Unmute */}
					<button
						type="button"
						onClick={toggleAudio}
						className={`p-4 rounded-full transition-all ${
							callState.isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
						}`}
						title={callState.isAudioEnabled ? 'Mute' : 'Unmute'}
					>
						{callState.isAudioEnabled ? (
							<Mic className="w-6 h-6 text-white" />
						) : (
							<MicOff className="w-6 h-6 text-white" />
						)}
					</button>

					{/* Video Toggle (only for video calls) */}
					{isVideoCall && (
						<button
							type="button"
							onClick={toggleVideo}
							className={`p-4 rounded-full transition-all ${
								callState.isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
							}`}
							title={callState.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
						>
							{callState.isVideoEnabled ? (
								<Video className="w-6 h-6 text-white" />
							) : (
								<VideoOff className="w-6 h-6 text-white" />
							)}
						</button>
					)}

					{/* End Call */}
					<button
						type="button"
						onClick={endCall}
						className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all"
						title="End call"
					>
						<PhoneOff className="w-6 h-6 text-white" />
					</button>
				</div>
			</div>

			{/* Calling Animation Overlay */}
			{callState.isCalling && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="flex flex-col items-center gap-4">
						<div className="w-4 h-4 rounded-full bg-green-500 animate-bounce" />
						<p className="text-white/70 text-lg animate-pulse">
							Waiting for {callState.remoteUser?.username} to answer...
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
