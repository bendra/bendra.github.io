---
layout: post
title:  "How well can Java Lambdas serve as nested functions?"
date:   2014-10-01 22:35:15
categories: javascript java lambda
---
#Nested Functions
This article will explore how closely Java lambdas can replicate the functionality of Javascript nested functions.  Not all programing languages support nested functions at all, and so as a programmer you could go a long time without seeing them, but for some problems they can be helpful.  If you have a function which logically consists of two different sub-operations, which themselves do not make any sense outside of the context of the overall function then writing them as nested sub-functions can improve readability as opposed to, say, writing them as class/object level private functions.  An example of this would be the split and merge operations of a Merge sort, or the partition and swap operations of Quicksort.  For this article I'll use a different example because its one which I enjoyed writing so much.

#The Javascript Code
This is a function I wrote some time ago for converting numbers (conventionally represented in Arabic notation) to Roman numerals. This Javascript code isn't the only or even necessarily the best way to do it but I liked it because it took advantage of several Javascript language features:

1. Nested functions for clarity
1. Closure (access to a function's local variable outside of its immediate lexical scope)
1. Multiple return values from a function

Here is the Javascript function:

{% highlight javascript linenos %}
var toRoman = function(input) {
  // these numbers can be converted into single Roman "digits
  var toArabic = [ 100, 50, 10, 5, 1 ], 
  // ...and these are the corresponding Roman characters for them
    fromRoman = [ 'C', 'L', 'X', 'V', 'I' ], 
    i = 0, j, nextVal, output = '';

  while (input > 0) {
    nextVal = nextRomanFor(input);
    output += nextVal['char'];
    input -= nextVal['num'];
  }
  return output;

  function nextRomanFor(num) {
    var nextNumber;
    for (; i < toArabic.length; i++) {
      nextNumber = toArabic[i];
      // return tuple of Roman-plus-Arabic-equivalent
      if (nextNumber <= num) {
        return {
          'char' : fromRoman[i],
          'num' : nextNumber
        };
      }
      // now look for a subtractable combination w/this number
      for (j = i + 1; j < toArabic.length; j++) {
        if (isSubtractable(toArabic[i], toArabic[j])) {
          nextNumber = toArabic[i] - toArabic[j];
          if (nextNumber <= num) {
            return {
              'char' : fromRoman[j] + fromRoman[i],
              'num' : nextNumber
            };
          }
          // if 1st subtractable isn't smaller, can continue
          break;
        }
      }
    }
  }

  function isSubtractable(num1, num2) {
    var d;

    // num2 is subtractable from num1 if is smaller & a power of 10
    if (num1 > num2) {
      // obtain log10(num2)
      d = Math.log(num2) / Math.log(10);
      // if is a whole number, is true
      return Math.floor(d) === d;
    }
    // got here, is false
    return false;
  }
}
{% endhighlight %}

Let's see how close Java can come to achieving the same things with the addition of Lambda syntax!

#Java Lambdas

Unlike Javascript, of course Java doesn't have top-level functions; all functions must be associated with a class (static methods) or the instances of a class (object methods).   As such, there's no direct analog for this type of construct; traditionally the closest we could come would be to use a class wrapper around a function, with a lot of unwanted verbosity.  However, as of JDK 1.8, we have a Lambda construct which can work in a similar fashion to a nested function (although as we will see later, the pre-existing baggage of a wrapper class is still there although hidden at development time).  A lambda is declared using the following syntax:

{% highlight java %}
Function<InputType, ReturnType> myFunction = (arg) -> { //arg is of type InputType 
  //code block, doSomething, return value of type ReturnType
}
{% endhighlight %}

This would be analogous to creating a Javascript function using a variable-assigned function:

{% highlight javascript %}
var myFunction = function(arg){
  //do something, If no explicit return, last evaluated statement supplies return value
}
{% endhighlight %}

A consequence of this is that the variable can't be used until it is assigned, and so the helper functions need to appear at the top of the method, before the code which uses them.  This isn't a severe shortcoming; Javascript is almost alone in allowing this type of construction (Haskell is the only other one I know of.  Scala technically allows this construction but in practice you [can't really use it][scala-post]).

#First Try

The closest and most straightforward implementation of this algorithm in Java would look like this:

{% highlight java linenos=table %}
public static String toRoman(int input) {
  // running count of how much we have left
  int remainder = input, i = 0;
  StringBuffer output = new StringBuffer();

  // num2 is subtractable from num1 if is smaller & a power of 10
  BiPredicate<Integer, Integer> isSubtractable = (num1, num2) -> {
    if (num1 > num2) {
      double d = Math.log(num2) / Math.log(10);
      return (Math.floor(d)) == d;
    }
    return false;
  };

  // In Java, to return multiple values must use array or collection
  Function<Integer, Object[]> nextRomanFor = (num) -> {
    int nextNumber;
    for (; i < intToRoman.length; i++) {
      nextNumber = intToRoman[i];
      if (nextNumber <= remainder) {
        return new Object[] { romanFromInt[i], nextNumber };
      } else {

        // try to find a subtractable combination to return
        for (int j = i + 1; j < intToRoman.length; j++) {
          if (isSubtractable.test(intToRoman[i], intToRoman[j])) {
            nextNumber = intToRoman[i] - intToRoman[j];
            if (nextNumber <= num) {
              return new Object[] {
                  romanFromInt[j] + romanFromInt[i],
                  nextNumber };
            }
            // if the largest subtractable number doesn't work,
            // we can exit loop
            break;
          }
        }
      }
    }
    // should never happen!
    return null;
  };

  while (remainder > 0) {
    // 1st return val is Roman numeral, 2nd is corresponding int value
    Object[] returnVal = nextRomanFor.apply(remainder);
    output.append((String) returnVal[0]);
    remainder -= (Integer) returnVal[1];
  }

  return output.toString();
}
{% endhighlight %}

Not so bad; the line count of the function is actually smaller than the Javascript version!  Of course with Java we'll have the additional overhead of the method signature, but still it will be close.  Unfortunately this code won't compile:

{% highlight console %}

error: local variables referenced from a lambda expression must be final or effectively final
                        for (; i < intToRoman.length; i++) {
                               ^
error: local variables referenced from a lambda expression must be final or effectively final
                                if (nextNumber <= remainder){
                                                  ^
{% endhighlight %}

The reason for this is that lambdas in Java are implemented by, at compile time, generating anonymous classes implementing predefined Functional Interfaces.  As a consequence, in order for the local variables (in this case remainder and output) to be accessible inside of the lambda expressions they must be marked final:

{% highlight java linenos=table linenostart=3 %}
    final int remainder = input, i = 0; 
    final StringBuffer output = new StringBuffer();
{% endhighlight %}

But now our method won't compile for another reason:

{% highlight console %}
error: cannot assign a value to final variable i
                        for (; i < intToRoman.length; i++) {
                                                      ^
error: cannot assign a value to final variable remainder
                        remainder -= (Integer)returnVal[1];
                        ^
{% endhighlight %}

This is because the final modifier not only makes our variables accessible to the lambda function it also becomes, well, final and so it can't be assigned.  Furthermore in Java an int is a primitive type and can't have its value modified (and its corresponding type Integer is immutable and final).  So what to do?

#Array as a primitive-by-reference

One solution is to use a trick that Java programmers have long used when they've needed pass-by-reference behavior for an argument to a method with a primitive value, namely to use a single-element array reference, and change the rest of the code as appropriate e.g.:

{% highlight java linenos=table linenostart=3 %}
    final int[] remainder = { input }, i = {0};
{% endhighlight %}
{% highlight java linenos=table linenostart=41 %}
      for (; i[0] < intToRoman.length; i[0]++){
{% endhighlight %}
{% highlight java linenos=table linenostart=72 %}
      remainder[0] -= (Integer) returnVal[1];
{% endhighlight %}

This makes the code a bit ugly but works just fine.  


#Mutable primitve wrapper

Another alternative would be to use a mutable reference with an int value like AtomicInteger from java.util.concurrent.  Again this is doable but it is rather verbose, for example:

{% highlight java linenos=table linenostart=3 %}
    final AtomicInteger remainder = new AtomicInteger(input), i = new AtomicInteger(0);
{% endhighlight %}
{% highlight java linenos=table linenostart=41 %}
      for (; i.get() < intToRoman.length; i.incrementAndGet()) {
{% endhighlight %}
{% highlight java linenos=table linenostart=72 %}
      remainder.set( remainder.get() - (Integer) returnVal[1]);
{% endhighlight %}

#Java Function vs Consumer

Another difference between the Java and Javascript code is in the return value from the nextRomanFor() function: in Javascript the function returns an associative array in the form of an object created on-the fly.  Because of Java's strong typing and lack of tuple syntax there's no analogous approach; what we can do is either return an array of Object[], as we did in example1, or create/appropriate another type for the multiple return values (many developers use java.util.Map.Entry as a two-item pseudo-tuple).  In this case there is another solution, which is to simply remove the return value for the function and do the assignment directly in nextRomanFor():

{% highlight java linenos=table linenostart=17 %}
    Consumer<Integer> nextRomanFor = (num) -> {
      int nextNumber;
      for (; i[0] < intToRoman.length; i[0]++) {
        nextNumber = intToRoman[i[0]];
        if (nextNumber <= remainder[0]) {
          output.append(romanFromInt[i[0]]);
          remainder[0] -= nextNumber;
        } else {
          // try to find a subtractable combination to return
          for (int j = i[0] + 1; j < intToRoman.length; j++) {
            if (isSubtractable.test(intToRoman[i[0]], intToRoman[j])) {
              // compound roman number, large value on right minus
              // small value on left
              nextNumber = intToRoman[i[0]] - intToRoman[j];
              if (nextNumber <= num) {
                output.append(romanFromInt[j] + romanFromInt[i[0]]);
                remainder[0] -= nextNumber;
              }
              // if the largest subtractable number doesn't work,
              // we can exit loop
              break;
            }
          }
        }
      }
    };
      while (remainder[0] > 0) {
      // 1st return val is Roman numeral, 2nd is corresponding int value
      nextRomanFor.accept(remainder[0]);
    }
{% endhighlight %}

Note that to do this we have to:

1. Change the type of the lambda expression from Function to Consumer (a Consumer is a lambda with no return value)
2. Change the code which calls the lambda expression to accept() instead of apply()

#Conclusion

Overall, Java Lambda expressions can approximate the functionality of what true nested functions offer in a language like Javascript, however in many scenarios the shoe-horned nature of the solution becomes apparent.  This example to my eye and experience results in some awkward looking and not necessarily intuitive patterns.

These patterns will make sense to an experienced Java developer and won't present a problem for them,  however in terms of attracting and gaining mind share among junior developers they represent another hurdle to overcome.  Java is no longer a small or simple language, and developers want to spend their time developing application code and not on learning patterns forced upon them by the idiosyncrasies of a programing language.

For an experienced Java developer, these considerations are minor compared to the question of how the new syntax affects application development, particularly web and network applications based on the increasingly popular asynchronous I/O model.  I'll explore this in a later article! 

[scala-post]: https://groups.google.com/forum/#!topic/scala-language/7_c2VpHexEM
