import {gzipSync,Gunzip,strToU8,strFromU8} from 'fflate';
import {MAX_PACKAGE_BYTES} from './proposals';

const prefix='ap-gzip-v1:';

/** Compression is only a storage envelope; exported files remain ordinary JSON. */
export function encodeLocalCollection(text:string):string{
 const raw=strToU8(text);
 if(raw.length>MAX_PACKAGE_BYTES)throw new Error('Local collection exceeds package limit.');
 const compressed=gzipSync(raw,{level:6});
 let binary='';
 for(let i=0;i<compressed.length;i+=32768)
  binary+=String.fromCharCode(...compressed.subarray(i,i+32768));
 return prefix+btoa(binary);
}

export function decodeLocalCollection(stored:string):string{
 if(!stored.startsWith(prefix))return stored; // Existing JSON remains readable.
 if(stored.length>MAX_PACKAGE_BYTES*2)throw new Error('Stored collection exceeds limit.');
 const binary=atob(stored.slice(prefix.length));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(bytes.length<18)throw new Error('Invalid compressed collection.');
 // Bound inflation independently of the untrusted GZIP size trailer, without
 // preallocating the full limit: stream into chunks and stop past the cap.
 const chunks:Uint8Array[]=[];let total=0;
 const inflater=new Gunzip(chunk=>{
  total+=chunk.length;
  if(total>MAX_PACKAGE_BYTES)throw new Error('Expanded collection exceeds limit.');
  chunks.push(chunk);
 });
 inflater.push(bytes,true);
 const raw=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length;}
 return strFromU8(raw);
}
