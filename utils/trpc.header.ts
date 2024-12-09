let model = "";

export function setModel(m: string) {
  model = m;
}

export function getModel() {
  return model;
}

export function getHeaders() {
  return {
    "X-Override-AI-Model": getModel(),
  };
}
