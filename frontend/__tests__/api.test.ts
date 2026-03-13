/**
 * Tests for streamChat in lib/api.ts
 */

import { TextEncoder, TextDecoder } from "util";
// jsdom does not provide TextEncoder/TextDecoder — polyfill from Node
Object.assign(global, { TextEncoder, TextDecoder });

import { streamChat } from "@/lib/api";
import { ChatMessage, NdaFormData } from "@/lib/types";
import { defaultFormData } from "@/lib/types";

/** Build a mock reader that yields encoded SSE chunks then closes. */
function makeMockReader(chunks: string[]) {
  const encoder = new TextEncoder();
  const encoded = chunks.map((c) => encoder.encode(c));
  let i = 0;
  return {
    read: jest.fn(async () => {
      if (i < encoded.length) {
        return { done: false, value: encoded[i++] };
      }
      return { done: true, value: undefined };
    }),
  };
}

function makeCallbacks() {
  return {
    onToken: jest.fn(),
    onFields: jest.fn(),
    onDone: jest.fn(),
    onError: jest.fn(),
  };
}

const messages: ChatMessage[] = [];
const formData: NdaFormData = { ...defaultFormData };

beforeEach(() => {
  jest.resetAllMocks();
});

describe("streamChat", () => {
  it("stream_with_done_event_calls_onDone_once", async () => {
    const reader = makeMockReader([
      'event: token\ndata: {"text":"hello"}\n\n',
      'event: done\ndata: {}\n\n',
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => reader },
    });

    const cb = makeCallbacks();
    await streamChat(messages, formData, cb, null);

    expect(cb.onDone).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it("stream_natural_close_without_done_calls_onDone", async () => {
    // Stream ends without a "done" SSE event — onDone must still fire (Bug 2 regression)
    const reader = makeMockReader([
      'event: token\ndata: {"text":"hello"}\n\n',
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => reader },
    });

    const cb = makeCallbacks();
    await streamChat(messages, formData, cb, null);

    expect(cb.onDone).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it("stream_done_not_duplicated_when_both_event_and_close", async () => {
    // "done" event received then stream closes — onDone called only once
    const reader = makeMockReader([
      'event: done\ndata: {}\n\n',
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => reader },
    });

    const cb = makeCallbacks();
    await streamChat(messages, formData, cb, null);

    expect(cb.onDone).toHaveBeenCalledTimes(1);
  });

  it("stream_error_event_calls_onError", async () => {
    const reader = makeMockReader([
      'event: error\ndata: {"message":"something went wrong"}\n\n',
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => reader },
    });

    const cb = makeCallbacks();
    await streamChat(messages, formData, cb, null);

    expect(cb.onError).toHaveBeenCalledWith("something went wrong");
    // onDone fires because stream closed naturally (no doneEmitted)
    expect(cb.onDone).toHaveBeenCalledTimes(1);
  });

  it("stream_abort_error_silenced", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn().mockRejectedValue(abortError),
        }),
      },
    });

    const cb = makeCallbacks();
    await streamChat(messages, formData, cb, null);

    expect(cb.onError).not.toHaveBeenCalled();
    expect(cb.onDone).not.toHaveBeenCalled();
  });
});
