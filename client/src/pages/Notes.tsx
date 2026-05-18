import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Note } from '../lib/api';
import TopBar from '../components/TopBar';
import { Plus, Pin, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

export default function Notes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [current, setCurrent] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function load() {
    const { notes } = await api.get<{ notes: Note[] }>('/notes');
    setNotes(notes);
    if (id) {
      const found = notes.find(n => n.id === id);
      if (found) {
        setCurrent(found);
        setTitle(found.title);
        setContent(found.content);
      }
    } else if (notes.length && !current) {
      navigate(`/notes/${notes[0].id}`, { replace: true });
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function createNote() {
    const { note } = await api.post<{ note: Note }>('/notes', { title: 'Untitled', content: '' });
    await load();
    navigate(`/notes/${note.id}`);
    setEditing(true);
  }

  async function save() {
    if (!current) return;
    const { note } = await api.patch<{ note: Note }>(`/notes/${current.id}`, { title, content });
    setCurrent(note);
    setEditing(false);
    load();
  }

  async function patch(n: Note, updates: any) {
    await api.patch(`/notes/${n.id}`, updates);
    load();
  }

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-ink-200 bg-white flex flex-col">
          <div className="h-12 px-4 border-b border-ink-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-warm-500" />
              <span className="text-[14px] font-semibold text-ink-900">Notes</span>
              <span className="text-2xs text-ink-500">{notes.length}</span>
            </div>
            <button onClick={createNote} className="icon-btn">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes.length === 0 && <div className="p-6 text-[13px] text-ink-400 text-center">No notes yet.</div>}
            {notes.map(n => (
              <button
                key={n.id}
                onClick={() => navigate(`/notes/${n.id}`)}
                className={clsx(
                  'w-full text-left px-4 py-2.5 border-b border-ink-150 hover:bg-ink-50',
                  current?.id === n.id && 'bg-ink-100'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-medium text-ink-900 truncate">
                    {n.title || 'Untitled'}
                  </div>
                  {n.pinned ? <Pin size={11} className="text-warm-500 shrink-0 mt-0.5" fill="currentColor" /> : null}
                </div>
                <div className="text-2xs text-ink-500 truncate mt-0.5">
                  {(n.content || '').replace(/[#*`>]/g, '').slice(0, 80) || 'Empty note'}
                </div>
                <div className="text-2xs text-ink-400 mt-1">
                  {formatDistanceToNow(n.updated_at, { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {current ? (
            <>
              <div className="h-12 px-6 border-b border-ink-200 bg-white flex items-center justify-between">
                <div className="text-[14px] font-semibold text-ink-900 truncate">{title || current.title || 'Untitled'}</div>
                <div className="flex items-center gap-1">
                  <button onClick={() => patch(current, { pinned: current.pinned ? 0 : 1 })} className="icon-btn">
                    <Pin size={14} fill={current.pinned ? 'currentColor' : 'none'} className={current.pinned ? 'text-warm-500' : ''} />
                  </button>
                  <button
                    onClick={async () => {
                      await api.delete(`/notes/${current.id}`);
                      setCurrent(null);
                      navigate('/notes');
                      load();
                    }}
                    className="icon-btn text-ink-500 hover:text-warm-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  {editing ? (
                    <button onClick={save} className="btn-primary h-7 px-2.5 text-[12px]">Save</button>
                  ) : (
                    <button onClick={() => setEditing(true)} className="btn-secondary h-7 px-2.5 text-[12px]">Edit</button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-3xl mx-auto">
                  {editing ? (
                    <>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full text-2xl font-semibold tracking-tight bg-transparent border-0 focus:outline-none placeholder-ink-300 mb-4"
                        placeholder="Title"
                      />
                      <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full min-h-[55vh] bg-transparent border-0 focus:outline-none text-ink-800 leading-relaxed resize-none font-mono text-[13px]"
                        placeholder="Markdown supported."
                      />
                    </>
                  ) : (
                    <div className="prose-chat text-ink-800 text-[14px]">
                      {current.content ? <ReactMarkdown>{current.content}</ReactMarkdown> : <div className="text-ink-400">Empty note. Click Edit to start writing.</div>}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-ink-400">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-[13px]">No note selected.</div>
                <button onClick={createNote} className="btn-primary mt-3">
                  <Plus size={13} /> New note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
