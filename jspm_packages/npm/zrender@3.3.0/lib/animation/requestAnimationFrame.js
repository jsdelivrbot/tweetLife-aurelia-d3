/* */ 


    module.exports = (typeof window !== 'undefined' &&
                                    (window.requestAnimationFrame
                                    || window.msRequestAnimationFrame
                                    || window.mozRequestAnimationFrame
                                    || window.webkitRequestAnimationFrame))
                                || function (func) {
                                    setTimeout(func, 16);
                                };

