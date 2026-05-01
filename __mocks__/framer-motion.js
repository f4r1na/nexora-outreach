const React = require('react');

// Proxy that maps motion.div, motion.section, etc. to plain HTML elements
const motion = new Proxy({}, {
  get: function (_, tag) {
    const Component = React.forwardRef(function MotionComponent(props, ref) {
      const {
        children,
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileFocus, whileInView,
        layout, layoutId, drag, dragConstraints,
        onAnimationComplete, onHoverStart, onHoverEnd,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    Component.displayName = 'motion.' + String(tag);
    return Component;
  },
});

function AnimatePresence({ children }) {
  return children || null;
}
AnimatePresence.displayName = 'AnimatePresence';

module.exports = {
  motion,
  AnimatePresence,
  useAnimation: function () { return { start: function () {}, stop: function () {} }; },
  useMotionValue: function (initial) { return { get: function () { return initial; }, set: function () {} }; },
  useTransform: function () { return 0; },
  useSpring: function (v) { return v; },
  useInView: function () { return true; },
  useCycle: function () { return [0, function () {}]; },
  useReducedMotion: function () { return false; },
};
