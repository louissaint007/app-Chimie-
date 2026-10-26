export const ELECTRON_SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

/** Return the classroom shell distribution for an element at the requested ion charge. */
export function getElectronShells(element, charge = 0) {
  const shells = [...(element.shells || [])];
  const electrons = Math.max(0, element.number - charge);
  let remaining = electrons - shells.reduce((sum, count) => sum + count, 0);

  if (remaining < 0) {
    let toRemove = -remaining;
    for (let index = shells.length - 1; index >= 0 && toRemove > 0; index--) {
      const removed = Math.min(shells[index], toRemove);
      shells[index] -= removed;
      toRemove -= removed;
    }
  } else if (remaining > 0) {
    let index = Math.max(shells.length - 1, 0);
    while (remaining > 0) {
      shells[index] ??= 0;
      const capacity = 2 * (index + 1) ** 2;
      const added = Math.min(remaining, capacity - shells[index]);
      shells[index] += added;
      remaining -= added;
      if (remaining > 0) index++;
    }
  }

  while (shells.at(-1) === 0) shells.pop();
  return shells;
}
