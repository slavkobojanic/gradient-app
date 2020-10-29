import {
  CanvaApiClient,
  CanvaImageBlob,
  ControlConfig,
  ControlName,
  CreateControl,
} from "@canva/editing-extensions-api-typings";
import { createTextChangeRange } from "typescript";
import { renderControls } from "./controls";

const canva: CanvaApiClient = window.canva.init();
const { imageHelpers } = window.canva;

let image: CanvaImageBlob;
let canvas: HTMLCanvasElement;
let alpha: number = 0.5;

type GradientStop = {
  stop: number;
  color: string;
};

let colors: { [key: string]: GradientStop } = {
  cp1: {
    stop: 0,
    color: "#FFFFFF",
  },
  cp2: {
    stop: 1,
    color: "#FFFFFF",
  },
};
let controls: { [key: string]: ControlConfig } = {
  config: canva.create(ControlName.GROUP, {
    id: "config",
    label: "Configuration",
    children: [
      canva.create(ControlName.BUTTON, {
        id: "add_color",
        label: "Add Color",
      }),
      canva.create(ControlName.SLIDER, {
        label: "Opacity",
        id: "opacity",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      }),
    ],
  }),
  cp1: canva.create(ControlName.GROUP, {
    id: "cp1",
    label: "Color 1",
    children: [
      canva.create(ControlName.COLOR_PICKER, {
        id: "cp1",
        label: "Color",
        color: colors["cp1"].color,
      }),
      canva.create(ControlName.SLIDER, {
        id: "cp1",
        label: "Stop",
        min: 0,
        max: 1,
        step: 0.01,
        value: 0,
      }),
    ],
  }),
  cp2: canva.create(ControlName.GROUP, {
    id: "cp2",
    label: "Color 2",
    children: [
      canva.create(ControlName.COLOR_PICKER, {
        id: "cp2",
        label: "Color",
        color: colors["cp2"].color,
      }),
      canva.create(ControlName.SLIDER, {
        id: "cp2",
        label: "Stop",
        min: 0,
        max: 1,
        step: 0.01,
        value: 1,
      }),
    ],
  }),
};

canva.onReady(async (opts) => {
  // create the required buttons
  canva.updateControlPanel(Object.values(controls));

  if (!opts.image) return;

  // Keep track of the user's image
  image = opts.image;

  // Convert the CanvaImage into a HTMLImageElement
  const img = await imageHelpers.toImageElement(image);

  // Create a HTMLCanvasElement
  canvas = document.createElement("canvas");

  // Resize the HTMLCanvasElement
  canvas.width = opts.previewSize.width;
  canvas.height = opts.previewSize.height;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  renderImage();

  // Render the user's image
  document.body.appendChild(canvas);
});

canva.onImageUpdate(async (opts) => {
  // Replace the original image with the updated image
  image = opts.image;
  renderImage();
});

canva.onSaveRequest(async () => {
  return imageHelpers.fromCanvas("image/jpeg", canvas);
});

canva.onControlsEvent(async (opts) => {
  if (!opts.message.commit) {
    return;
  }
  if (
    opts.message.controlId === "opacity" &&
    opts.message.controlType === ControlName.SLIDER
  ) {
    alpha = opts.message.message.value;
  }
  if (
    opts.message.controlId === "add_color" &&
    opts.message.controlType === ControlName.BUTTON
  ) {
    const id = Object.keys(controls).length;
    controls[`cp${id}`] = canva.create(ControlName.GROUP, {
      id: `cp${id}`,
      label: `Color ${id}`,
      children: [
        canva.create(ControlName.COLOR_PICKER, {
          id: `cp${id}`,
          label: "Color",
          color: "#FFFFFF",
        }),
        canva.create(ControlName.SLIDER, {
          id: `cp${id}`,
          label: "Stop",
          min: 0,
          max: 1,
          step: 0.01,
          value: 1,
        }),
      ],
    });
    colors[`cp${id}`] = {
      color: "#FFFFFF",
      stop: 1,
    };
    canva.updateControlPanel(Object.values(controls));
  }
  if (opts.message.controlType === ControlName.COLOR_PICKER) {
    colors[opts.message.controlId].color = opts.message.message.value;
  }
  if (
    opts.message.controlId !== "opacity" &&
    opts.message.controlType === ControlName.SLIDER
  ) {
    colors[opts.message.controlId].stop = opts.message.message.value;
  }
  renderImage();
});

async function renderImage() {
  // Convert the user's image image into a HTMLImageElement
  if (!image) return;
  const img = await imageHelpers.toCanvas(image);

  // Draw the HTMLImageElement into the HTMLCanvasElement
  const context = canvas.getContext("2d");
  if (!context) return;

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  for (let c of Object.values(colors)) {
    gradient.addColorStop(c.stop, c.color);
  }
  context.globalAlpha = alpha;
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}
