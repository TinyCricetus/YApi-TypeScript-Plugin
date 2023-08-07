// this file is used to parse cookie simply

export function parseCookieFromDocument() {
  const str = document.cookie

  console.log('original cookie string: ', str)

  return str
}