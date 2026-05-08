import { useState, useRef, useCallback } from 'react';
import { PermissionState } from '../types';

// Browser support guard — we only support Chrome and Edge
export const isBrowserSupported = (): boolean => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg\//.test(ua);
    return isChrome || isEdge;
};

export const useCamera = () => {
    const [permission, setPermission] = useState<PermissionState>('idle');
    const [micPermission, setMicPermission] = useState<PermissionState>('idle');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const requestAccess = useCallback(async () => {
        setPermission('requesting');
        setMicPermission('requesting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setPermission('granted');
            setMicPermission('granted');
        } catch (err: any) {
            // NotAllowedError = user denied
            // NotFoundError = no camera/mic hardware
            console.error('[Camera] Access error:', err.name, err.message);
            setPermission('denied');
            setMicPermission('denied');
        }
    }, []);

    const stopAccess = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    return {
        permission,
        micPermission,
        videoRef,
        streamRef,
        requestAccess,
        stopAccess,
    };
};