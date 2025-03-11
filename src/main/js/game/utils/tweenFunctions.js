/*
* @Description:
* @Author:	Geordi Guo 
* @Email:	Geordi.Guo@igt.com
* @Date:	2019-05-21 17:02:53
* @Last Modified by:	Geordi Guo
* @Last Modified time:	2019-08-09 13:36:29
*/


define(function module(){
    /*
     * We have had to add our own implementations of sin and cos due to the fact
     * that Android 4.1, 4.2 & 4.3 contain a bug in their WebView component that causes
     * the value of sin & cos to be reported incorrectly occasionally.
     * To combat this we have our own implementation based on the Taylor Series.
     * To adjust the number of terms computed change the value accuracy below.
     */
    var Maths = {};
    (function(obj)
    {
        var factorial = [1];
        var accuracy = 25;
        for (var i = 1; i < accuracy; i++) {
          factorial[i] = factorial[i-1] * i;
        }

        function precision_sum(array) {
          var result = 0;
          while (array.length > 0) {
            result += array.pop();
          }
          return result;
        }

        obj.sin = function(x)
        {
            x = x % (Math.PI * 2);
            var sign = 1;
            var x2 = x*x;
            var terms = [];
            for (var i = 1; i < accuracy; i += 2)
            {
                terms.push(sign * x / factorial[i]);
                x *= x2;
                sign *= -1;
            }
            return precision_sum(terms);
        };

        obj.cos = function(x)
        {
            x = x % (Math.PI * 2);
            var sign = -1;
            var x2 = x*x;
            x = x2;
            var terms = [1];
            for (var i = 2; i < accuracy; i += 2)
            {
                terms.push(sign * x / factorial[i]);
                x *= x2;
                sign *= -1;
            }
            return precision_sum(terms);
        };
    })(Maths);


// https://github.com/chenglou/tween-functions
// t is the current time (or position) of the tween. This can be seconds or frames, steps, seconds, ms, whatever – as long as the unit is the same as is used for the total time
// b is the beginning value of the property.
// c is the destination value of the property.
// d is the total time of the tween.    
    var TweenFunctions = {
        linear: function(t, b, _c, d) {
          var c = _c - b;
          return c * t / d + b;
        },
        easeInQuad: function(t, b, _c, d) {
          var c = _c - b;
          return c * (t /= d) * t + b;
        },
        easeOutQuad: function(t, b, _c, d) {
          var c = _c - b;
          return -c * (t /= d) * (t - 2) + b;
        },
        easeInOutQuad: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d / 2) < 1) {
            return c / 2 * t * t + b;
          } else {
            return -c / 2 * ((--t) * (t - 2) - 1) + b;
          }
        },
        easeInCubic: function(t, b, _c, d) {
          var c = _c - b;
          return c * (t /= d) * t * t + b;
        },
        easeOutCubic: function(t, b, _c, d) {
          var c = _c - b;
          return c * ((t = t / d - 1) * t * t + 1) + b;
        },
        easeInOutCubic: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d / 2) < 1) {
            return c / 2 * t * t * t + b;
          } else {
            return c / 2 * ((t -= 2) * t * t + 2) + b;
          }
        },
        easeInQuart: function(t, b, _c, d) {
          var c = _c - b;
          return c * (t /= d) * t * t * t + b;
        },
        easeOutQuart: function(t, b, _c, d) {
          var c = _c - b;
          return -c * ((t = t / d - 1) * t * t * t - 1) + b;
        },
        easeInOutQuart: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d / 2) < 1) {
            return c / 2 * t * t * t * t + b;
          } else {
            return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
          }
        },
        easeInQuint: function(t, b, _c, d) {
          var c = _c - b;
          return c * (t /= d) * t * t * t * t + b;
        },
        easeOutQuint: function(t, b, _c, d) {
          var c = _c - b;
          return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },
        easeInOutQuint: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d / 2) < 1) {
            return c / 2 * t * t * t * t * t + b;
          } else {
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
          }
        },
        easeInSine: function(t, b, _c, d) {
          var c = _c - b;
          return -c * Maths.cos(t / d * (Math.PI / 2)) + c + b;
        },
        easeOutSine: function(t, b, _c, d) {
          var c = _c - b;
          return c * Maths.sin(t / d * (Math.PI / 2)) + b;
        },
        easeInOutSine: function(t, b, _c, d) {
          var c = _c - b;
          return -c / 2 * (Maths.cos(Math.PI * t / d) - 1) + b;
        },
        easeInExpo: function(t, b, _c, d) {
          var c = _c - b;
          return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOutExpo: function(t, b, _c, d) {
          var c = _c - b;
          return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOutExpo: function(t, b, _c, d) {
          var c = _c - b;
          if (t === 0) {
            return b;
          }
          if (t === d) {
            return b + c;
          }
          if ((t /= d / 2) < 1) {
            return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
          } else {
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
          }
        },
        easeInCirc: function(t, b, _c, d) {
          var c = _c - b;
          return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
        },
        easeOutCirc: function(t, b, _c, d) {
          var c = _c - b;
          return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
        },
        easeInOutCirc: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d / 2) < 1) {
            return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
          } else {
            return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
          }
        },
        easeInElastic: function(t, b, _c, d) {
          var c = _c - b;
          var a, p, s;
          s = 1.70158;
          p = 0;
          a = c;
          if (t === 0) {
            return b;
          } else if ((t /= d) === 1) {
            return b + c;
          }
          if (!p) {
            p = d * 0.3;
          }
          if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
          } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
          }
          return -(a * Math.pow(2, 10 * (t -= 1)) * Maths.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        easeOutElastic: function(t, b, _c, d) {
          var c = _c - b;
          var a, p, s;
          s = 1.70158;
          p = 0;
          a = c;
          if (t === 0) {
            return b;
          } else if ((t /= d) === 1) {
            return b + c;
          }
          if (!p) {
            p = d * 0.3;
          }
          if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
          } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
          }
          return a * Math.pow(2, -10 * t) * Maths.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
        },
        easeInOutElastic: function(t, b, _c, d) {
          var c = _c - b;
          var a, p, s;
          s = 1.70158;
          p = 0;
          a = c;
          if (t === 0) {
            return b;
          } else if ((t /= d / 2) === 2) {
            return b + c;
          }
          if (!p) {
            p = d * (0.3 * 1.5);
          }
          if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
          } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
          }
          if (t < 1) {
            return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Maths.sin((t * d - s) * (2 * Math.PI) / p)) + b;
          } else {
            return a * Math.pow(2, -10 * (t -= 1)) * Maths.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
          }
        },
        easeInBack: function(t, b, _c, d, s) {
          var c = _c - b;
          if (s === void 0) {
            s = 1.70158;
          }
          return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOutBack: function(t, b, _c, d, s) {
          var c = _c - b;
          if (s === void 0) {
            s = 1.70158;
          }
          return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOutBack: function(t, b, _c, d, s) {
          var c = _c - b;
          if (s === void 0) {
            s = 1.70158;
          }
          if ((t /= d / 2) < 1) {
            return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
          } else {
            return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
          }
        },
        easeInBounce: function(t, b, _c, d) {
          var c = _c - b;
          var v;
          v = TweenFunctions.easeOutBounce(d - t, 0, c, d);
          return c - v + b;
        },
        easeOutBounce: function(t, b, _c, d) {
          var c = _c - b;
          if ((t /= d) < 1 / 2.75) {
            return c * (7.5625 * t * t) + b;
          } else if (t < 2 / 2.75) {
            return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75) + b;
          } else if (t < 2.5 / 2.75) {
            return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375) + b;
          } else {
            return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375) + b;
          }
        },
        easeInOutBounce: function(t, b, _c, d) {
          var c = _c - b;
          var v;
          if (t < d / 2) {
            v = TweenFunctions.easeInBounce(t * 2, 0, c, d);
            return v * 0.5 + b;
          } else {
            v = TweenFunctions.easeOutBounce(t * 2 - d, 0, c, d);
            return v * 0.5 + c * 0.5 + b;
          }
        },
        /*
          @a is amplitude, default 5
          @r is number of pingPong round need to be happened during the time. default 1
        */
        pingPong: function (t, b, _c, d, a = 5, r = 1){
          return b + a * Maths.sin( t / d * r * 2 * Math.PI);
        },
    };

    return TweenFunctions;
});
