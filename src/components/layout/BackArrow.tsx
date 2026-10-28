/** "Back" arrow that points toward the start of the line in both LTR and RTL. */
export function BackArrow() {
  return (
    <span aria-hidden className="inline-block rtl:rotate-180">
      ←
    </span>
  );
}
