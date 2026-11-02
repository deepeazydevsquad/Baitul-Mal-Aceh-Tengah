import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { parse, compileScript } from "@vue/compiler-sfc";
import { transform } from "esbuild";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;

let Confirmation;
let Notification;
let useConfirmation;
let createApp;
let h;
let nextTick;

const vueUrl = import.meta.resolve("vue");

function rewriteVueImport(code) {
  return code.replace(
    /from\s+["']vue["']/g,
    `from ${JSON.stringify(vueUrl)}`
  );
}

async function importJavaScript(code, filename) {
  const url = `data:text/javascript;base64,${Buffer.from(
    rewriteVueImport(code)
  ).toString("base64")}#${encodeURIComponent(filename)}`;
  return import(url);
}

async function loadSfc(relativePath) {
  const filename = path.resolve(process.cwd(), relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const { descriptor, errors } = parse(source, { filename });
  assert.deepEqual(errors, []);
  const compiled = compileScript(descriptor, {
    id: `security-${Buffer.from(relativePath).toString("hex")}`,
    inlineTemplate: true,
  });
  const javascript = await transform(compiled.content, {
    loader: "ts",
    format: "esm",
    target: "es2022",
  });
  return importJavaScript(javascript.code, filename);
}

async function loadTypeScript(relativePath) {
  const filename = path.resolve(process.cwd(), relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = await transform(source, {
    loader: "ts",
    format: "esm",
    target: "es2022",
  });
  return importJavaScript(compiled.code, filename);
}

before(async () => {
  ({ createApp, h, nextTick } = await import("vue"));
  Confirmation = (
    await loadSfc("src/components/Modal/Confirmation.vue")
  ).default;
  Notification = (
    await loadSfc("src/components/Modal/Notification.vue")
  ).default;
  ({ useConfirmation } = await loadTypeScript(
    "src/composables/useConfirmation.ts"
  ));
});

after(async () => {
  dom.window.close();
});

function mountComponent(component, props, slots = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const app = createApp({
    render() {
      return h(component, props, slots);
    },
  });
  app.mount(container);

  return {
    app,
    cleanup() {
      app.unmount();
      container.remove();
      document.body.innerHTML = "";
    },
  };
}

test("confirmation dialog renders approve and reject payloads as inert text", async () => {
  const payload =
    '<img src=x onerror="window.__confirmationXssExecuted = true">';

  for (const title of ["Konfirmasi Approve", "Konfirmasi Reject"]) {
    const state = useConfirmation();
    let callbackCalls = 0;
    state.displayConfirmation(title, payload, () => {
      callbackCalls += 1;
    });

    const mounted = mountComponent(
      Confirmation,
      {
        showConfirmDialog: state.showConfirmDialog.value,
        confirmTitle: state.confirmTitle.value,
        confirmMessage: state.confirmMessage.value,
      },
      {
        default: () => [
          h(
            "button",
            {
              class: "test-confirm",
              onClick: () => state.confirm(() => {}),
            },
            "Ya"
          ),
        ],
      }
    );
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]');
    assert.ok(dialog);
    assert.equal(dialog.querySelector("img"), null);
    assert.match(dialog.textContent, /<img src=x onerror=/);
    assert.equal(globalThis.window.__confirmationXssExecuted, undefined);

    dialog.querySelector(".test-confirm").click();
    await nextTick();
    assert.equal(callbackCalls, 1);
    mounted.cleanup();
  }
});

test("confirmation preserves ordinary quotes, ampersands, and line breaks", async () => {
  const state = useConfirmation();
  state.displayConfirmation(
    "Konfirmasi",
    'Nama "Ahmad" & keluarga\nBaris kedua',
    () => {}
  );
  const mounted = mountComponent(Confirmation, {
    showConfirmDialog: state.showConfirmDialog.value,
    confirmTitle: state.confirmTitle.value,
    confirmMessage: state.confirmMessage.value,
  });
  await nextTick();

  const paragraph = document.body.querySelector('[role="dialog"] p');
  assert.equal(paragraph.textContent, 'Nama "Ahmad" & keluarga\nBaris kedua');
  assert.match(paragraph.className, /whitespace-pre-line/);
  mounted.cleanup();
});

test("confirmation cancel closes the dialog without invoking the action", async () => {
  const state = useConfirmation();
  let callbackCalls = 0;
  state.displayConfirmation("Konfirmasi", "Fixture", () => {
    callbackCalls += 1;
  });
  const mounted = mountComponent(
    Confirmation,
    {
      showConfirmDialog: state.showConfirmDialog.value,
      confirmTitle: state.confirmTitle.value,
      confirmMessage: state.confirmMessage.value,
    },
    {
      default: () =>
        h(
          "button",
          {
            class: "test-cancel",
            onClick: () => state.cancel(() => {}),
          },
          "Tidak"
        ),
    }
  );
  await nextTick();

  document.body.querySelector(".test-cancel").click();
  await nextTick();
  assert.equal(callbackCalls, 0);
  assert.equal(state.showConfirmDialog.value, false);
  mounted.cleanup();
});

test("notification HTML compatibility prop is rendered as inert text", async () => {
  const payload =
    '<img src=x onerror="window.__notificationXssExecuted = true">';
  const mounted = mountComponent(Notification, {
    showNotification: true,
    notificationType: "error",
    notificationMessageHtml: payload,
  });
  await nextTick();

  assert.equal(document.body.querySelector("img"), null);
  assert.match(document.body.textContent, /<img src=x onerror=/);
  assert.equal(globalThis.window.__notificationXssExecuted, undefined);
  mounted.cleanup();
});
