import * as Y from 'yjs';
import { yXmlFragmentToProseMirrorJSON } from 'y-prosemirror';

const ydoc = new Y.Doc();
const type = ydoc.getXmlFragment('default');

const p = new Y.XmlElement('paragraph');
p.insert(0, [new Y.XmlText('Hello world')]);
type.insert(0, [p]);

console.log("JSON:", JSON.stringify(yXmlFragmentToProseMirrorJSON(type)));
