import { useState } from 'react';
import type { Faq } from '../../lib/types';
import { deleteRow, ErrorLine, Panel, saveRow, useTable } from './kit';

export default function FaqAdmin() {
  const { rows, refresh, error } = useTable<Faq>('faqs');
  const [msg, setMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Faq>>>({});

  const val = (f: Faq) => ({ ...f, ...drafts[f.id] });

  return (
    <Panel
      title="FAQ"
      action={
        <button
          className="btn btn-primary h-10 px-4 text-[14px]"
          onClick={async () => {
            await saveRow('faqs', { question: 'New question', answer: 'Answer', sort: rows.length + 1 }).catch((x) => setMsg(x.message));
            refresh();
          }}
        >
          Add question
        </button>
      }
    >
      <ErrorLine msg={error || msg} />
      <div className="space-y-4">
        {rows.map((f) => {
          const v = val(f);
          const dirty = !!drafts[f.id];
          return (
            <div key={f.id} className="rounded-xl border border-line p-4">
              <div className="flex gap-2">
                <input className="field w-20 shrink-0" type="number" aria-label="Order" value={v.sort} onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...drafts[f.id], sort: +e.target.value } })} />
                <input className="field" aria-label="Question" value={v.question} onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...drafts[f.id], question: e.target.value } })} />
              </div>
              <textarea className="field mt-2" rows={3} aria-label="Answer" value={v.answer} onChange={(e) => setDrafts({ ...drafts, [f.id]: { ...drafts[f.id], answer: e.target.value } })} />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  className="btn btn-ghost h-9 px-3 text-[13px]"
                  onClick={async () => {
                    if (!confirm('Delete this question?')) return;
                    await deleteRow('faqs', f.id).catch((x) => setMsg(x.message));
                    refresh();
                  }}
                >
                  Delete
                </button>
                <button
                  className="btn btn-primary h-9 px-4 text-[13px]"
                  disabled={!dirty}
                  onClick={async () => {
                    await saveRow('faqs', v).catch((x) => setMsg(x.message));
                    const d = { ...drafts };
                    delete d[f.id];
                    setDrafts(d);
                    refresh();
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
