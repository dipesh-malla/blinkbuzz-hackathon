import { useRef, useState } from 'react';
import type { Edition, Media } from '../../lib/types';
import { youtubeId } from '../../lib/data';
import { deleteRow, ErrorLine, F, Panel, removeStoredFile, saveRow, uploadFile, useTable } from './kit';

// Shrinks photos in the browser before upload (keeps the free storage tier lean).
async function shrink(file: File, max = 1800): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  let img: ImageBitmap;
  try {
    img = await createImageBitmap(file);
  } catch {
    if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) throw new Error(`${file.name} is a HEIC photo, which browsers can't show. Export it as JPG first (Photos → File → Export).`);
    return file;
  }
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file;
}

export default function MediaAdmin() {
  const { rows, setRows, refresh, error } = useTable<Media>('media');
  const [removing, setRemoving] = useState<string | null>(null);
  const { rows: editions } = useTable<Edition>('editions', 'number');
  const [edition, setEdition] = useState('');
  const [video, setVideo] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [videoMsg, setVideoMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const ed = edition || editions.find((e) => e.is_current)?.id || editions[0]?.id || '';
  const edName = editions.find((e) => e.id === ed)?.title ?? 'this edition';

  const addPhotos = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length || !ed) {
      if (files && Array.from(files).length) setPhotoMsg('Only image files (JPG, PNG, WebP) can go in the gallery.');
      return;
    }
    setPhotoMsg(null);
    let n = 0;
    let failed = 0;
    for (const f of list) {
      setProgress(`Uploading ${++n} of ${list.length}…`);
      try {
        const url = await uploadFile(await shrink(f), `gallery/${ed}`);
        await saveRow('media', { edition_id: ed, kind: 'image', url, alt: f.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' '), sort: rows.length + n });
        refresh(); // show each photo as soon as it lands
      } catch (x) {
        failed++;
        setPhotoMsg((x as Error).message);
      }
    }
    setProgress(failed ? null : `${list.length - failed} photo${list.length - failed === 1 ? '' : 's'} added to ${edName}.`);
    if (input.current) input.current.value = '';
    refresh();
  };

  const validVideo = !!youtubeId(video);
  const addVideo = async () => {
    if (!validVideo) return setVideoMsg('Paste a YouTube link, like youtube.com/watch?v=… or youtu.be/…');
    setVideoMsg(null);
    try {
      await saveRow('media', { edition_id: ed, kind: 'video', url: video, alt: videoTitle, sort: rows.length });
      setVideo('');
      setVideoTitle('');
      refresh();
    } catch (x) {
      setVideoMsg((x as Error).message);
    }
  };

  const list = rows.filter((m) => m.edition_id === ed);

  return (
    <div className="space-y-6">
      <Panel title="Gallery">
        <F label="Which edition are these for?">
          <select className="field sm:max-w-[280px]" value={ed} onChange={(e) => setEdition(e.target.value)}>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </F>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Photos: the main way to fill the gallery */}
        <div className="lg:col-span-3">
          <Panel title="Photos">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                addPhotos(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                drag ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" className="text-accent" aria-hidden>
                <path
                  d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[16px] font-medium">Click to choose photos, or drop them here</span>
              <span className="text-[13px] text-muted">JPG, PNG or WebP · several at once · resized automatically · uploads start right away</span>
              <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
            </label>
            {progress && <p className="mt-3 text-[14px] text-accent">{progress}</p>}
            <ErrorLine msg={photoMsg} />
          </Panel>
        </div>

        {/* Videos: optional, YouTube only */}
        <div className="lg:col-span-2">
          <Panel title="Videos (optional)">
            <p className="mb-4 text-[13px] text-muted">
              Only for YouTube videos. Upload the video to YouTube first, then paste its link here. Skip this if you only have photos.
            </p>
            <div className="space-y-3">
              <F label="YouTube link">
                <input className="field" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" />
              </F>
              <F label="Video title">
                <input className="field" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Edition 01 aftermovie" />
              </F>
              <button className="btn btn-ghost w-full" onClick={addVideo} disabled={!validVideo}>
                Add video
              </button>
            </div>
            <ErrorLine msg={videoMsg} />
          </Panel>
        </div>
      </div>

      <Panel title={`In the gallery for ${edName} (${list.length})`}>
        <ErrorLine msg={error} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((m) => {
            const yt = m.kind === 'video' ? youtubeId(m.url) : null;
            return (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-bg">
                <img src={yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : m.url} alt={m.alt} className="h-full w-full object-cover" loading="lazy" />
                {yt && <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">Video</span>}
                <button
                  className="absolute inset-x-2 bottom-2 rounded-lg bg-black/75 py-1.5 text-[13px] text-white opacity-100 transition-opacity disabled:opacity-60 md:opacity-0 md:group-hover:opacity-100"
                  disabled={removing === m.id}
                  onClick={async () => {
                    if (!confirm('Remove this item from the gallery?')) return;
                    setRemoving(m.id);
                    try {
                      await deleteRow('media', m.id);
                      setRows((r) => r.filter((x) => x.id !== m.id)); // gone at once, one click
                      if (m.kind === 'image') removeStoredFile(m.url).catch(() => {}); // free the storage too
                      refresh();
                    } catch (x) {
                      setPhotoMsg((x as Error).message);
                    } finally {
                      setRemoving(null);
                    }
                  }}
                >
                  {removing === m.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            );
          })}
          {!list.length && <p className="col-span-full text-muted">Nothing for this edition yet. Add photos above.</p>}
        </div>
      </Panel>
    </div>
  );
}
