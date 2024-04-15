"use strict";

var consoleError = console.error.bind(console);
beforeAll(function () {
  console.error = function () {
    return !/Warning: ReactDOM\.render is no longer supported in React 18/.test(arguments.length <= 0 ? undefined : arguments[0]) && consoleError.apply(void 0, arguments);
  };
});
afterAll(function () {
  console.error = consoleError;
});