import { useState } from 'react';
import type { Edition, Media } from '../../lib/types';
import { youtubeId } from '../../lib/data';
import { deleteRow, ErrorLine, F, Panel, saveRow, uploadFile, useTable } from './kit';

// Shrinks photos in the browser before upload (keeps the free storage tier lean).
async function shrink(file: File, max = 1800): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.82));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file;
}

export default function MediaAdmin() {
  const { rows, refresh, error } = useTable<Media>('media');
  const { rows: editions } = useTable<Edition>('editions', 'number');
  const [edition, setEdition] = useState('');
  const [video, setVideo] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const ed = edition || editions[0]?.id || '';

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || !ed) return;
    setMsg(null);
    let n = 0;
    for (const f of Array.from(files)) {
      setProgress(`Uploading ${++n} of ${files.length}…`);
      try {
        const url = await uploadFile(await shrink(f), `gallery/${ed}`);
        await saveRow('media', { edition_id: ed, kind: 'image', url, alt: f.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' '), sort: rows.length + n });
      } catch (x) {
        setMsg((x as Error).message);
      }
    }
    setProgress(null);
    refresh();
  };

  const addVideo = async () => {
    if (!youtubeId(video)) return setMsg('Paste a YouTube link (youtube.com/watch?v=… or youtu.be/…).');
    try {
      await saveRow('media', { edition_id: ed, kind: 'video', url: video, alt: videoTitle, sort: rows.length });
      setVideo('');
      setVideoTitle('');
      refresh();
    } catch (x) {
      setMsg((x as Error).message);
    }
  };

  const list = rows.filter((m) => m.edition_id === ed);

  return (
    <Panel title="Gallery">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="Edition">
          <select className="field" value={ed} onChange={(e) => setEdition(e.target.value)}>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </F>
        <F label="Add photos (resized automatically)">
          <input className="field pt-2.5" type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} />
        </F>
        <F label="YouTube link">
          <input className="field" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" />
        </F>
        <F label="Video title">
          <div className="flex gap-2">
            <input className="field" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Edition 01 aftermovie" />
            <button className="btn btn-primary shrink-0" onClick={addVideo}>
              Add
            </button>
          </div>
        </F>
      </div>
      <p className="mt-3 text-[13px] text-muted">Videos stay on YouTube, so they don’t use your storage.</p>
      {progress && <p className="mt-3 text-[14px] text-accent">{progress}</p>}
      <ErrorLine msg={error || msg} />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((m) => {
          const yt = m.kind === 'video' ? youtubeId(m.url) : null;
          return (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-bg">
              <img src={yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : m.url} alt={m.alt} className="h-full w-full object-cover" loading="lazy" />
              {yt && <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">Video</span>}
              <button
                className="absolute inset-x-2 bottom-2 rounded-lg bg-black/75 py-1.5 text-[13px] text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                onClick={async () => {
                  if (!confirm('Remove this item from the gallery?')) return;
                  await deleteRow('media', m.id).catch((x) => setMsg(x.message));
                  refresh();
                }}
              >
                Remove
              </button>
            </div>
          );
        })}
        {!list.length && <p className="col-span-full text-muted">Nothing for this edition yet.</p>}
      </div>
    </Panel>
  );
}
