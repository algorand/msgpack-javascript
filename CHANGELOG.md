# This is the revision history of algorand-msgpack

## 1.1.0 2024-07-31

https://github.com/algorand/msgpack-javascript/compare/algorand-v1.0.1...algorand-v1.1.0

- Add `RawBinaryString` class, which enables encoding byte arrays as msgpack strings.
- Add decoding option `useRawBinaryStringClass`, which if enabled alongside `rawBinaryStringKeys` or `rawBinaryStringValues` will decode msgpack strings as `RawBinaryString` instances instead of `Uint8Array`s.

## 1.0.1 2024-03-12

https://github.com/algorand/msgpack-javascript/compare/algorand-v1.0.0...algorand-v1.0.1

- Fix import issue.

## 1.0.0 2024-03-12

https://github.com/msgpack/msgpack-javascript/compare/1fc7622...algorand:msgpack-javascript:algorand-v1.0.0

- Initial release of library. This fork is based on @msgpack/msgpack commit 1fc7622.
