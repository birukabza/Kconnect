# AI Pipeline Contract

## Input

The backend sends the AI pipeline:

- `audio_bytes`: raw uploaded audio
- `content_type`: audio MIME type

Example:

```python
result = await process_audio(
    audio_bytes=audio_bytes,
    content_type=audio.content_type
)