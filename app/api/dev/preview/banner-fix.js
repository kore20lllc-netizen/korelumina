var require = (name) => {
  if (name === "react") return window.React;
  if (name === "react-dom") return window.ReactDOM;

  // 🔥 REQUIRED FIX
  if (name === "react/jsx-runtime") {
    return {
      jsx: (type, props) => window.React.createElement(type, props),
      jsxs: (type, props) => window.React.createElement(type, props),
      Fragment: window.React.Fragment,
    };
  }

  if (name === "react/jsx-dev-runtime") {
    return {
      jsxDEV: (type, props) => window.React.createElement(type, props),
      Fragment: window.React.Fragment,
    };
  }

  throw new Error("Module not supported: " + name);
};

var process = { env: { NODE_ENV: "development" } };
