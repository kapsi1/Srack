import { uploadDirect } from '@uploadcare/upload-client';

const UPLOADCARE_PUBKEY = 'd86ddf17b265b2d92afa';

export interface UploadResult {
	uuid: string;
	name: string;
	size: number;
	cdnUrl: string;
	mimeType: string;
}

export const uploadFile = async (file: File | Blob): Promise<UploadResult> => {
	const result = await uploadDirect(file, {
		publicKey: UPLOADCARE_PUBKEY,
		store: 'auto',
	});

	return {
		uuid: result.uuid,
		name: result.name || 'recording.webm',
		size: result.size,
		cdnUrl: result.cdnUrl,
		mimeType: result.mimeType || (file instanceof File ? file.type : 'audio/webm'),
	};
};
