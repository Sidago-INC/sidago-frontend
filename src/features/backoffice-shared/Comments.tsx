

import { Avatar } from "@/components/ui/Avatar";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  Bell,
  Check,
  ChevronDown,
  MessageCircle,
  Paperclip,
  Pencil,
  Send,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, useRef, useState } from "react";

type Attachment = {
  id: number;
  name: string;
  sizeLabel: string;
  type: string;
  url: string;
};

// ---------------- TYPES ----------------
type Comment = {
  id: number;
  user: string;
  text: string;
  attachments: Attachment[];
  likes: number;
  likedByCurrentUser: boolean;
  replies: Comment[];
};

const USERS = ["Alice", "Bob", "Charlie", "David"];
const FILTERS = [
  "All Comments",
  "Record Comments",
  "Comments on Attachments",
  "Comments with Attachments",
];

function updateCommentTree(
  comments: Comment[],
  id: number,
  updater: (comment: Comment) => Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === id) {
      return updater(comment);
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: updateCommentTree(comment.replies, id, updater),
    };
  });
}

function deleteCommentTree(comments: Comment[], id: number): Comment[] {
  return comments
    .filter((comment) => comment.id !== id)
    .map((comment) => ({
      ...comment,
      replies: deleteCommentTree(comment.replies, id),
    }));
}

function createAttachments(files: FileList | null): Attachment[] {
  if (!files || files.length === 0) {
    return [];
  }

  return Array.from(files).map((file) => ({
    id: Date.now() + Math.random(),
    name: file.name,
    sizeLabel:
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    type: file.type,
    url: URL.createObjectURL(file),
  }));
}

function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove?: (id: number) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <a
            href={attachment.url}
            download={attachment.name}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 cursor-pointer"
          >
            <div className="truncate font-medium">{attachment.name}</div>
            <div className="text-[11px] text-slate-400">
              {attachment.sizeLabel}
            </div>
          </a>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              aria-label={`Remove ${attachment.name}`}
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
// ---------------- MAIN ----------------
export default function Comments() {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [notificationMode, setNotificationMode] = useState("mentions");
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const currentUser = "Alice";

  const handleInput = (val: string) => {
    setInput(val);
    setMentionOpen(/@\w*$/.test(val));
  };

  const insertMention = (name: string) => {
    setInput((prev) => prev.replace(/@\w*$/, `@${name} `));
    setMentionOpen(false);
  };

  const addComment = () => {
    if (!input.trim() && attachments.length === 0) return;

    setComments([
      {
        id: Date.now(),
        user: currentUser,
        text: input,
        attachments,
        likes: 0,
        likedByCurrentUser: false,
        replies: [],
      },
      ...comments,
    ]);

    setInput("");
    setAttachments([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Collapsed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between px-4 py-3
          bg-white hover:bg-slate-50
          dark:bg-slate-900 dark:hover:bg-slate-800
          border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Avatar name={currentUser} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Add a comment
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MessageCircle size={16} />
            {comments.length}
          </div>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="overflow-visible
        bg-white dark:bg-slate-900
        border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b
          border-slate-200 dark:border-slate-700"
          >
            <Popover className="relative">
              <PopoverButton className="flex cursor-pointer items-center gap-1 text-sm text-slate-600 transition hover:opacity-80 dark:text-slate-300">
                {filter} <ChevronDown size={14} />
              </PopoverButton>

              <Transition
                as={Fragment}
                enter="transition duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-75"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <PopoverPanel
                  anchor="top end"
                  portal
                  className="z-260 w-65 rounded-lg border shadow-lg
                bg-white dark:bg-slate-800
                border-slate-200 dark:border-slate-700"
                >
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className="w-full px-3 py-2 text-left text-sm
                      cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700
                      text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>{f}</span>
                      {filter === f && <Check size={14} />}
                    </button>
                  ))}
                </PopoverPanel>
              </Transition>
            </Popover>

            <div className="flex items-center gap-2">
              {/* Notification Popover */}
              <Popover className="relative">
                <PopoverButton className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                  <Bell size={16} />
                  <ChevronDown size={12} />
                </PopoverButton>

                <Transition
                  as={Fragment}
                  enter="transition duration-100"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition duration-75"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <PopoverPanel
                    anchor="top"
                    portal
                    className="z-260 w-64 rounded-lg border shadow-lg
                    bg-white dark:bg-slate-800
                    border-slate-200 dark:border-slate-700"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => setNotificationMode("mentions")}
                        className="w-full text-left px-3 py-2 rounded-md text-sm
                        text-slate-700 dark:text-slate-200
                        hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>Notify me only for @mentions</span>
                        {notificationMode === "mentions" && <Check size={14} />}
                      </button>

                      <button
                        onClick={() => setNotificationMode("all")}
                        className="w-full text-left px-3 py-2 rounded-md text-sm
                        text-slate-700 dark:text-slate-200
                        hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>Notify me about all comments</span>
                        {notificationMode === "all" && <Check size={14} />}
                      </button>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>

              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <Popover className="relative w-full">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => handleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-200 dark:border-slate-700
                  text-slate-800 dark:text-slate-200"
                />

                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setAttachments((current) => [
                      ...current,
                      ...createAttachments(e.target.files),
                    ])
                  }
                />

                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border border-slate-200 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Attach files"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={addComment}
                  className="cursor-pointer rounded-lg bg-blue-600 px-3 text-white hover:bg-blue-700"
                >
                  <Send size={16} />
                </button>
              </div>

              <AttachmentList
                attachments={attachments}
                onRemove={(id) =>
                  setAttachments((current) =>
                    current.filter((attachment) => attachment.id !== id),
                  )
                }
              />

              <Transition
                as={Fragment}
                show={mentionOpen}
                enter="transition duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-75"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <PopoverPanel
                  className="absolute bottom-full left-0 z-260 mb-1 w-48 rounded-lg border shadow-lg
                bg-white dark:bg-slate-800
                border-slate-200 dark:border-slate-700"
                >
                  {USERS.map((user) => (
                    <button
                      key={user}
                      onClick={() => insertMention(user)}
                      className="block w-full px-3 py-2 text-left text-sm
                      cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      @{user}
                    </button>
                  ))}
                </PopoverPanel>
              </Transition>
            </Popover>
          </div>

          {/* Comments */}
          <div className="max-h-80 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 && (
              <p className="text-sm text-slate-400 text-center">
                No comments yet
              </p>
            )}

            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUser={currentUser}
                setComments={setComments}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- COMPONENTS ----------------

function CommentItem({
  comment,
  currentUser,
  setComments,
}: {
  comment: Comment;
  currentUser: string;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}) {
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [openReply, setOpenReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.text);
  const isOwnComment = comment.user === currentUser;
  const replyAttachmentInputRef = useRef<HTMLInputElement | null>(null);

  const like = () => {
    setComments((prev) =>
      updateCommentTree(prev, comment.id, (item) => ({
        ...item,
        likedByCurrentUser: !item.likedByCurrentUser,
        likes: item.likedByCurrentUser
          ? Math.max(0, item.likes - 1)
          : item.likes + 1,
      })),
    );
  };

  const addReply = () => {
    if (!reply.trim() && replyAttachments.length === 0) return;

    setComments((prev) =>
      updateCommentTree(prev, comment.id, (item) => ({
        ...item,
        replies: [
          ...item.replies,
          {
            id: Date.now(),
            user: currentUser,
            text: reply,
            attachments: replyAttachments,
            likes: 0,
            likedByCurrentUser: false,
            replies: [],
          },
        ],
      })),
    );

    setReply("");
    setReplyAttachments([]);
    setOpenReply(false);
    if (replyAttachmentInputRef.current) {
      replyAttachmentInputRef.current.value = "";
    }
  };

  const saveEdit = () => {
    if (!editValue.trim()) {
      return;
    }

    setComments((prev) =>
      updateCommentTree(prev, comment.id, (item) => ({
        ...item,
        text: editValue.trim(),
      })),
    );
    setIsEditing(false);
  };

  const deleteComment = () => {
    setComments((prev) => deleteCommentTree(prev, comment.id));
  };

  return (
    <div
      className="rounded-lg border p-3
    border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar name={comment.user} />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {comment.user}
          </span>
        </div>

        <button
          onClick={like}
          className="flex cursor-pointer items-center gap-1 text-xs text-slate-500"
        >
          <ThumbsUp size={14} /> {comment.likes}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="cursor-pointer rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditValue(comment.text);
                setIsEditing(false);
              }}
              className="cursor-pointer rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
            {comment.text}
          </p>
          <AttachmentList attachments={comment.attachments} />
        </>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setOpenReply(!openReply)}
          className="cursor-pointer text-xs text-blue-500"
        >
          Reply
        </button>
        {isOwnComment && !isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Pencil size={12} />
              Edit
            </button>
            <button
              onClick={deleteComment}
              className="flex cursor-pointer items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </>
        ) : null}
      </div>

      {openReply && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="flex-1 rounded border px-2 py-1 text-sm
              bg-slate-50 dark:bg-slate-800
              border-slate-200 dark:border-slate-700"
            />
            <input
              ref={replyAttachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setReplyAttachments((current) => [
                  ...current,
                  ...createAttachments(e.target.files),
                ])
              }
            />
            <button
              type="button"
              onClick={() => replyAttachmentInputRef.current?.click()}
              className="cursor-pointer rounded border border-slate-200 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Attach files to reply"
            >
              <Paperclip size={14} />
            </button>
            <button
              onClick={addReply}
              className="cursor-pointer rounded bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
            >
              Send
            </button>
          </div>
          <AttachmentList
            attachments={replyAttachments}
            onRemove={(id) =>
              setReplyAttachments((current) =>
                current.filter((attachment) => attachment.id !== id),
              )
            }
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-3 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-2">
          {comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              currentUser={currentUser}
              setComments={setComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
