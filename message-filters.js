const filters = {
  ignoreCase: (s) => s.toLowerCase(),
  // TODO: More comprehensive punctuation coverage
  // TODO: Fix this; it doesn't work
  noPunctuation: (s) => s.replace(/\.\?\!/g, ''),
}

export default filters
