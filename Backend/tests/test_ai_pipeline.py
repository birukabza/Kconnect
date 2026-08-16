import asyncio
import base64

from app.schemas.response import Intent
from app.services import ai_pipeline
from app.services.rag_orchestration import RagOrchestrationResult


def test_translation_and_rag_run_in_parallel_after_stt(monkeypatch, capsys):
    translation_started = asyncio.Event()
    rag_started = asyncio.Event()

    async def fake_transcribe(**_kwargs):
        return "Do I need to wear this helmet?"

    async def fake_translate(**_kwargs):
        translation_started.set()
        await asyncio.wait_for(rag_started.wait(), timeout=1)
        return "Translated text"

    async def fake_synthesize(**_kwargs):
        return b"translated audio"

    async def fake_rag_path(**_kwargs):
        rag_started.set()
        await asyncio.wait_for(translation_started.wait(), timeout=1)
        return RagOrchestrationResult(
            intent=Intent(
                category="transport",
                sub_category="moto",
                situation="helmet_use",
                search_query="moto helmet requirement Rwanda",
            ),
            cultural_tip="Fasten the helmet before the moto moves.",
        )

    monkeypatch.setattr(ai_pipeline, "_transcribe_audio", fake_transcribe)
    monkeypatch.setattr(ai_pipeline, "_translate_text", fake_translate)
    monkeypatch.setattr(ai_pipeline, "_synthesize_speech", fake_synthesize)
    monkeypatch.setattr(ai_pipeline, "_rag_path", fake_rag_path)

    result = asyncio.run(
        ai_pipeline.process_audio(
            audio_bytes=b"audio",
            content_type="audio/wav",
            filename="test.wav",
            direction="en-to-rw",
            database=object(),
        )
    )

    assert result.translated_text == "Translated text"
    assert result.translated_audio == base64.b64encode(
        b"translated audio"
    ).decode("ascii")
    assert result.intent.situation == "helmet_use"
    assert result.cultural_tip == (
        "Fasten the helmet before the moto moves."
    )
    trace_output = capsys.readouterr().out
    assert (
        "[speech trace] transcription (en): "
        "Do I need to wear this helmet?"
    ) in trace_output
    assert "[speech trace] translation (rw): Translated text" in trace_output
