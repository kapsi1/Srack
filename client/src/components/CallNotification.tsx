import { Phone, PhoneOff, Video } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';

export function CallNotification() {
	const { callState, incomingCallData, acceptCall, rejectCall } = useCall();
	const ringtoneSoundRef = useRef<HTMLAudioElement | null>(null);

	// Play ringtone when receiving a call
	useEffect(() => {
		if (callState.isReceivingCall && incomingCallData) {
			// Create a simple oscillating tone as ringtone
			const audioContext = new (
				window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
			)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.value = 440;
			oscillator.type = 'sine';
			gainNode.gain.value = 0.1;

			oscillator.start();

			// Create a pulsing effect
			const pulseInterval = setInterval(() => {
				gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
			}, 1000);

			return () => {
				clearInterval(pulseInterval);
				oscillator.stop();
				audioContext.close();
			};
		}
	}, [callState.isReceivingCall, incomingCallData]);

	if (!callState.isReceivingCall || !incomingCallData) {
		return null;
	}

	const isVideoCall = incomingCallData.callType === 'video';

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

			{/* Notification Card */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in duration-300">
					{/* Caller Info */}
					<div className="flex flex-col items-center">
						<div className="relative mb-4">
							<img
								src={
									incomingCallData.from.avatar ||
									`https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCallData.from.username}`
								}
								alt={incomingCallData.from.username}
								className="w-24 h-24 rounded-full border-4 border-green-500/50 shadow-lg"
							/>
							{/* Ringing animation */}
							<div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
							<div
								className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-50"
								style={{ animationDelay: '0.5s' }}
							/>
						</div>

						<h3 className="text-xl font-bold text-white mb-1">{incomingCallData.from.username}</h3>

						<div className="flex items-center gap-2 text-gray-400 mb-6">
							{isVideoCall ? (
								<>
									<Video className="w-4 h-4" />
									<span>Incoming Video Call</span>
								</>
							) : (
								<>
									<Phone className="w-4 h-4" />
									<span>Incoming Voice Call</span>
								</>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-center gap-6">
						{/* Reject */}
						<button type="button" onClick={rejectCall} className="flex flex-col items-center gap-2 group">
							<div className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg group-hover:scale-110">
								<PhoneOff className="w-6 h-6 text-white" />
							</div>
							<span className="text-sm text-gray-400">Decline</span>
						</button>

						{/* Accept */}
						<button type="button" onClick={acceptCall} className="flex flex-col items-center gap-2 group">
							<div className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-all shadow-lg group-hover:scale-110 animate-pulse">
								{isVideoCall ? <Video className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
							</div>
							<span className="text-sm text-gray-400">Accept</span>
						</button>
					</div>
				</div>
			</div>

			{/* Hidden audio element for potential ringtone file */}
			<audio ref={ringtoneSoundRef} loop className="hidden" />
		</>
	);
}
