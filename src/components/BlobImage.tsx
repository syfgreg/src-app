import { useEffect, useState } from "react";

/** Renders a Blob from IndexedDB as an <img>, managing the object URL. */
export function BlobImage({ blob, alt, className }: { blob?: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!blob || !url) return null;
  return <img src={url} alt={alt} className={className} />;
}

/**
 * Renders a photo from either a remote Storage URL (cloud) or a local Blob
 * (offline, pre-upload). Prefers the URL when both are present.
 */
export function Photo({
  url,
  blob,
  alt,
  className,
}: {
  url?: string;
  blob?: Blob;
  alt: string;
  className?: string;
}) {
  if (url) return <img src={url} alt={alt} className={className} />;
  if (blob) return <BlobImage blob={blob} alt={alt} className={className} />;
  return null;
}
