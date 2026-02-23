type FinalizationRegistryInstance<T> = {
  register: (target: object, heldValue: T, unregisterToken?: object) => void
  unregister: (unregisterToken: object) => boolean
}

type WeakRefInstance<T extends object> = {
  deref: () => T
}

type WeakRefHolder = {
  _value: object
}

const NoopFinalizationRegistry = function <T>(
  this: FinalizationRegistryInstance<T>,
  _cleanupCallback: (heldValue: T) => void
) {}

NoopFinalizationRegistry.prototype.register = function <T>(
  this: FinalizationRegistryInstance<T>,
  _target: object,
  _heldValue: T,
  _unregisterToken?: object
) {}

NoopFinalizationRegistry.prototype.unregister = function <T>(
  this: FinalizationRegistryInstance<T>,
  _unregisterToken: object
) {
  return false
}

const SimpleWeakRef = function <T extends object>(this: WeakRefHolder, value: T) {
  this._value = value
}

SimpleWeakRef.prototype.deref = function <T extends object>(this: {
  _value: T
}) {
  return this._value
}

// Hermes on some Android builds can throw when dependencies reference these globals.
if (typeof globalThis.FinalizationRegistry === 'undefined') {
  ;(globalThis as any).FinalizationRegistry = NoopFinalizationRegistry
}

if (typeof globalThis.WeakRef === 'undefined') {
  ;(globalThis as any).WeakRef = SimpleWeakRef
}
