type FinalizationRegistryInstance<T> = {
  register: (target: object, heldValue: T, unregisterToken?: object) => void
  unregister: (unregisterToken: object) => boolean
}

type FinalizationRegistryConstructor = new <T>(
  cleanupCallback: (heldValue: T) => void
) => FinalizationRegistryInstance<T>

type WeakRefInstance<T extends object> = {
  deref: () => T
}

type WeakRefConstructor = new <T extends object>(value: T) => WeakRefInstance<T>

type GlobalWithRuntimeCompat = typeof globalThis & {
  FinalizationRegistry?: FinalizationRegistryConstructor
  WeakRef?: WeakRefConstructor
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

const runtimeGlobal = globalThis as GlobalWithRuntimeCompat

// Hermes on some Android builds can throw when dependencies reference these globals.
if (typeof runtimeGlobal.FinalizationRegistry === 'undefined') {
  runtimeGlobal.FinalizationRegistry =
    NoopFinalizationRegistry as unknown as FinalizationRegistryConstructor
}

if (typeof runtimeGlobal.WeakRef === 'undefined') {
  runtimeGlobal.WeakRef = SimpleWeakRef as unknown as WeakRefConstructor
}
