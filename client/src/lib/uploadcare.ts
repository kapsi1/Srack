import { uploadDirect } from '@uploadcare/upload-client';

const UPLOADCARE_PUBKEY = 'd86ddf17b265b2d92afa';

export interface UploadResult {
	uuid: string;
	name: string;
	size: number;
	cdnUrl: string;
	mimeType: string;
}

export const uploadFile = async (file: File | Blob, fileName?: string): Promise<UploadResult> => {
	const name = fileName || (file instanceof File ? file.name : 'recording.webm');

	const result = await uploadDirect(file, {
		publicKey: UPLOADCARE_PUBKEY,
		store: 'auto',
		fileName: name,
	});

	return {
		uuid: result.uuid,
		name: result.name || name,
		size: result.size,
		cdnUrl: result.cdnUrl,
		mimeType: result.mimeType || (file instanceof File ? file.type : 'audio/webm'),
	};
};
