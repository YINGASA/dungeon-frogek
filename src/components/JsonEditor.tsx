import { useState } from 'react';

export const JsonEditor = ({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) => {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [message, setMessage] = useState('JSON 可编辑');

  const apply = () => {
    try {
      onChange(JSON.parse(text));
      setMessage('JSON 校验通过，已应用到预览。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSON 解析失败');
    }
  };

  return (
    <div className="json-editor">
      <div className="toolbar-row">
        <span>{message}</span>
        <button onClick={apply}>校验并应用</button>
      </div>
      <textarea value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
    </div>
  );
};
