import { uploadFile } from './src/infra/storage/storage.service.js';

async function test() {
  const fakeImageBuffer = Buffer.from('esto es una prueba, no es una imagen real');
  const key = await uploadFile({
    buffer: fakeImageBuffer,
    contentType: 'text/plain',
    folder: 'test',
  });
  console.log('✅ Subida exitosa, key:', key);
}

test().catch((err) => {
  console.error('❌ Error al subir:', err);
});