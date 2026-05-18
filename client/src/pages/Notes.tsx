import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Note } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { Plus, Pin, Trash2, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

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

  async function togglePin(n: Note) {
    await api.patch(`/notes/${n.id}`, { pinned: n.pinned ? 0 : 1 });
    load();
  }

  async function remove(n: Note) {
    await api.delete(`/notes/${n.id}`);
    if (current?.id === n.id) setCurrent(null);
    navigate('/notes');
    load();
  }

  async function summarize() {
    if (!current) return;
    const { result } = await api.post<{ result: string }>('/assistant/summarize', {
      text: current.content,
      instruction: 'Summarize this note in 3-5 bullets, then suggest 2 next actions.',
    });
    setContent(prev => `${prev}\n\n---\n\n### Siri summary\n${result}`);
    setEditing(true);
  }

  return (
    <div className="h-full flex">
      <aside className="w-72 border-r border-ink-200 bg-white flex flex-col">
        <div className="p-3 border-b border-ink-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink-900">All notes</div>
          <button onClick={createNote} className="btn-ghost p-1.5">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && <div className="p-6 text-sm text-ink-400 text-center">No notes yet.</div>}
          {notes.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(`/notes/${n.id}`)}
              className={`w-full text-left px-4 py-3 border-b border-ink-100 hover:bg-ink-50 ${current?.id === n.id ? 'bg-brand-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm text-ink-900 truncate">{n.title || 'Untitled'}</div>
                {n.pinned ? <Pin size={12} className="text-amber-500 shrink-0 mt-0.5" fill="currentColor" /> : null}
              </div>
              <div className="text-xs text-ink-500 truncate mt-0.5">
                {(n.content || '').replace(/[#*`>]/g, '').slice(0, 80) || 'Empty note'}
              </div>
              <div className="text-xs text-ink-400 mt-1">{formatDistanceToNow(n.updated_at, { addSuffix: true })}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {current ? (
          <>
            <PageHeader
              title={current.title || 'Untitled'}
              subtitle={`Updated ${formatDistanceToNow(current.updated_at, { addSuffix: true })}`}
              actions={
                <div className="flex items-center gap-2">
                  <button onClick={summarize} className="btn-secondary">
                    <Sparkles size={16} /> Summarize
                  </button>
                  <button onClick={() => togglePin(current)} className="btn-ghost">
                    <Pin size={16} fill={current.pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => remove(current)} className="btn-ghost text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                  {editing ? (
                    <button onClick={save} className="btn-primary">Save</button>
                  ) : (
                    <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
                  )}
                </div>
              }
            />
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-3xl mx-auto">
                {editing ? (
                  <>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full text-2xl font-semibold bg-transparent border-0 focus:outline-none placeholder-ink-300 mb-4"
                      placeholder="Title"
                    />
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="w-full min-h-[60vh] bg-transparent border-0 focus:outline-none text-ink-800 leading-relaxed resize-none font-mono text-sm"
                      placeholder="Start writing… Markdown supported."
                    />
                  </>
                ) : (
                  <div className="prose-chat text-ink-800">
                    {current.content ? <ReactMarkdown>{current.content}</ReactMarkdown> : <div className="text-ink-400">Empty note. Click Edit to start writing.</div>}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-ink-400">
            <div className="text-center">
              <div>No note selected.</div>
              <button onClick={createNote} className="btn-primary mt-4">
                <Plus size={16} /> New note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
