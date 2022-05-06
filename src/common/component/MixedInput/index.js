import { useRef, useEffect, useState, useCallback } from 'react';
import { useKey } from 'rooks';
import { useDispatch, useSelector } from 'react-redux';
import { Editor, Transforms } from 'slate';
import {
 createPlateUI,
 Plate,
 createExitBreakPlugin,
 createTrailingBlockPlugin,
 createNodeIdPlugin,
 createParagraphPlugin,
 // createImagePlugin,
 createSoftBreakPlugin,
 // createComboboxPlugin,
 createMentionPlugin,
 // comboboxSelectors,
 // getMentionOnSelectItem,
 // findMentionInput,
 // removeMentionInput,
 // isSelectionInMentionInput,
 createPlugins,
 ELEMENT_PARAGRAPH,
 getPlateEditorRef,
 // usePlateEditorRef,
 // ELEMENT_IMAGE,
 MentionCombobox
} from '@udecode/plate';
import { createComboboxPlugin } from '@udecode/plate-combobox';
import { ReactEditor } from 'slate-react';
import Styled from './styled';
import { CONFIG } from './config';
import Contact from '../Contact';
import { updateUploadFiles } from '../../../app/slices/ui';
export const TEXT_EDITOR_PREFIX = 'rustchat_text_editor';

let components = createPlateUI({
 // [ELEMENT_IMAGE]: ImageElement,
 // customize your components by plugin key
});
const initialValue = [{ type: ELEMENT_PARAGRAPH, children: [{ text: '' }] }];
const Plugins = ({
 id = '',
 placeholder = 'Write some markdown...',
 sendMessages,
 members = []
}) => {
 const dispatch = useDispatch();
 const enableMentions = members.length > 0;
 const filesRef = useRef([]);
 const contactData = useSelector((store) => store.contacts.byId);
 const [msgs, setMsgs] = useState([]);
 const [cmdKey, setCmdKey] = useState(false);
 const editableRef = useRef(null);
 const initialProps = {
  ...CONFIG.editableProps,
  className: 'box',
  placeholder
 };
 useEffect(() => {
  const handlePasteEvent = (evt) => {
   const files = [...evt.clipboardData.files];
   if (files.length) {
    const filesData = files.map((file) => {
     const { size, type, name } = file;
     console.log('paste event name', name);
     const url = URL.createObjectURL(file);
     return { size, type, name, url };
    });
    const [context, to] = id.split('_');

    console.log('paste event', context, to, files, evt);
    dispatch(updateUploadFiles({ context, id: to, data: filesData }));
   }
  };
  window.addEventListener('paste', handlePasteEvent);
  return () => {
   window.removeEventListener('paste', handlePasteEvent);
  };
  // window.addEventListener("paste")
 }, []);

 useKey(
  'Enter',
  (evt) => {
   console.log('enter keypress', evt);
   if (evt.shiftKey || evt.ctrlKey || evt.altKey || evt.isComposing) {
    return true;
   }
   evt.preventDefault();
   sendMessages(msgs);
   // 清空
   const plateEditor = getPlateEditorRef(`${TEXT_EDITOR_PREFIX}_${id}`);
   Transforms.delete(plateEditor, {
    at: {
     anchor: Editor.start(plateEditor, []),
     focus: Editor.end(plateEditor, [])
    }
   });
  },
  {
   // eventTypes: ["keydown"],
   target: editableRef,
   when: !cmdKey
  }
 );
 useKey(
  [91, 93],
  (evt) => {
   setCmdKey(evt.type == 'keydown');
   console.log('cmd', evt.type);
  },
  {
   eventTypes: ['keydown', 'keyup'],
   target: editableRef
  }
 );
 const pluginArr = [
  createParagraphPlugin(),
  createNodeIdPlugin(),
  createSoftBreakPlugin(CONFIG.softBreak),
  createTrailingBlockPlugin(CONFIG.trailingBlock),
  createExitBreakPlugin(CONFIG.exitBreak)
 ];
 const plugins = createPlugins(
  enableMentions
   ? pluginArr.concat([
      createComboboxPlugin(),
      createMentionPlugin({
       options: {
        createMentionNode: (item) => {
         console.log('mention', item);
         const {
          text,
          data: { uid }
         } = item;
         return { value: `@${text}`, uid };
        },
        insertSpaceAfterMention: true
       }
      })
     ])
   : pluginArr,
  {
   components
  }
 );

 const handleChange = useCallback(
  async (val) => {
   console.log('tmps changed', val);
   const tmps = [];
   const getMixedText = (children) => {
    const mentions = [];
    const arr = children.map(({ type, text, uid }) => {
     if (type == 'mention') {
      mentions.push(uid);
      return ` @${uid} `;
     }
     return text;
    });
    return { value: arr.join(''), mentions };
   };
   for (const v of val) {
    if (v.type == 'img') {
     // img
     const url = v.url;
     const file_path = decodeURIComponent(new URL(url).searchParams.get('file_path'));
     console.log('files', filesRef.current, file_path);
     const json = filesRef.current.find((f) => f.path == file_path) || {};
     const { name, size, hash, path, ...rest } = json;
     tmps.push({
      type: 'file',
      content: { name, size, hash, path },
      properties: rest
     });
    } else {
     // p
     const { value, mentions } = getMixedText(v.children);
     const prev = tmps[tmps.length - 1];
     if (!prev) {
      tmps.push([{ type: 'text', content: value, properties: { mentions } }]);
     } else {
      if (Array.isArray(prev)) {
       tmps[tmps.length - 1].push({
        type: 'text',
        content: value,
        properties: { mentions }
       });
      } else {
       tmps.push([{ type: 'text', content: value, properties: { mentions } }]);
      }
     }
    }
   }
   const arr = tmps.map((tmp) => {
    return Array.isArray(tmp)
     ? {
        type: 'text',
        content: tmp.map((t) => t.content).join('\n'),
        properties: {
         mentions: tmp.map((t) => t.properties?.mentions || []).flat()
        }
       }
     : tmp;
   });
   const msgs = arr.filter(({ content }) => !!content);
   setMsgs(msgs);
   console.log('tmps', tmps, arr, msgs);
  },
  [msgs]
 );

 return (
  <Styled className="input" ref={editableRef}>
   <Plate
    onChange={handleChange}
    id={`${TEXT_EDITOR_PREFIX}_${id}`}
    editableProps={{ ...initialProps, style: { userSelect: 'text' } }}
    initialValue={initialValue}
    plugins={plugins}
   >
    {enableMentions ? (
     <MentionCombobox
      // component={StyledCombobox}
      onRenderItem={({ item }) => {
       console.log('wtf', item);
       return <Contact uid={item.data.uid} interactive={false} />;
      }}
      items={members.map((id) => {
       const data = contactData[id];
       if (!data) return null;
       const { uid, name, ...rest } = data;
       return {
        key: uid,
        text: name,
        data: {
         uid,
         ...rest
        }
       };
      })}
     />
    ) : null}
   </Plate>
  </Styled>
 );
};

export const useMixedEditor = (key) => {
 const editorRef = getPlateEditorRef(`${TEXT_EDITOR_PREFIX}_${key}`);
 const focus = () => {
  if (editorRef) {
   ReactEditor.focus(editorRef);
  }
 };
 const insertText = (txt) => {
  if (editorRef) {
   editorRef.insertText(txt);
  }
 };
 return {
  focus,
  insertText
 };
};
export default Plugins;
