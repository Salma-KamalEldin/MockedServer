## Mock Secure Channel Behavior

This mock server simulates a secure channel for development purposes.

### How it works
- The first call to `/server/publicKey` initializes a session AES key.
- The key is stored in memory for the lifetime of the server process.
- All subsequent APIs use this shared key for AES-GCM encryption/decryption.

### Limitations
- ECDH and public key verification are not fully replicated.
- This is intentional to unblock client development.
- Full cryptographic validation is performed only against the real backend.

### Restart behavior
- Restarting the server clears the session key.
- The client must re-initiate the key exchange.

### Important
- This behavior is **mock-only** and must not be used in production.
