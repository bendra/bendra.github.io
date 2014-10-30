---
layout: post
title:  "Fun with Java 8 Streams, Part I"
date:   2014-10-28 22:35:15
categories: java lambda stream 
comments: true
---

#Streams in Java 8

The functional enhancements of Java 8 have been a source of great interest for me because this is an area I see where Java suffers the most in comparison to some other platforms.  I'm currently working toward a more substantial web application where I can more fully explore how developers should set their expectations, but along the way I've been making some interesting discoveries.  In this article I'll relate a couple of them!

I'm assuming on the part of the reader a basic familiarity with Java Lambdas. I'm also not going to attempt to give any sort of introduction to Java 8 streams; if you are looking for such a thing you might like [Benjamin WinterBerg's article](http://winterbe.com/posts/2014/07/31/java8-stream-tutorial-examples/) (I did).  Instead I'm going to illustrate a few problems I've come accross and the ways in which I solved them; hopefully the idioms uncovered here will be of use elsewhere.

#Reduce Function

The java.util.stream.Stream class contains a reduce method, which should be familiar to anyone who has done functional programing using e.g. Lisp, Python, Ruby, etc.  Basically reduce is a [Higher-order function](http://en.wikipedia.org/wiki/Higher-order_function) which iterates over a series of elements and recursively applies an operation to them to produce a single output value.  A trivial example in Lisp would be:

{% highlight lisp %}
> (reduce * '(2 3 4))
24
{% endhighlight %}

The first argument is the operation (in this case *, or multiply), the second the data to operate on.  So from this expression we get 2 * 3 * 4 = 24.  Neat.

In Java 8 the equivilent code is more verbose (as one might expect) but fairly similar:

{% highlight java %}
int[] data = {2, 3, 4};
OptionalInt result = Arrays.stream(data).reduce((i,j) -> i * j);
{% endhighlight %}

Other than the need to create a stream and the fact that this returns an OptionalInt rather than an int, this is a fairly natural way to program.  However this is to a degree a function (ha ha) of the fact that the Stream (actually IntStream in this case) class has the reduce method build in.  What if I want to do something not anticipated by the class designer?

#Reductions Function

Just such a thing happened to me when I had a need of a reductions operation.  This is the same as reduce but it returns all of the intermediate values as well as the final value.  For example:

{% highlight lisp %}
> (reductions * '(2 3 4))
(2 6 24)
{% endhighlight %}

Unfortunately there is no way we can have the same nice method-daisy-chain syntax as in the reduce example.  Stream doesn't have a reductions method and Java doesn't have mixins so there's no way to add it.  What we can do is write a static method of our own, then we can use something like:

{% highlight java %}
Integer[] data = {2, 3, 4};
Stream result = StreamUtil.reductions(Arrays.stream(data), (i, j) -> i * j);
{% endhighlight %}

Note that we are using an array of Integers rather than primative int types; more on this later.

This is the method signature of java.util.Stream.reduce():
{% highlight java %}

Optional<T> reduce(BinaryOperator<T> accumulator);
{% endhighlight %}

Our reductions should return a Stream instead of a single (Optional) result; also we need to pass the input Stream as an argument:

{% highlight java %}
public static <T> Stream<T> reductions(Stream<T> input, BinaryOperator<T> accumulator)
{% endhighlight %}

#Implementing Reductions

The first place to look for how to implement the reductions() of course should be the JDK's implementation of Stream.reduce().  This is implemented in java.util.stream.ReferencePipeline (and its parent class java.util.stream.AbstractPipeline), but for us it's not much help. The implementation is built around the helper classes java.util.stream.ReduceOps and its inner class ReducingSink and Box, all of which are both final and package-visable (aka "public for me, private for you").  This has the effect of making them impossible to reuse even if we could figure out how to work with the.  So we are on our own.

Fortunately its not too hard to implement the logic of what we want to do using the Stream.map() method:

{% highlight java %}
public static <T> Stream<T> reductions(Stream<T> input, BinaryOperator<T> accumulator) {

   <T> accTot = null;
   return input.map(i -> {
      if (accTot == null) {
         accTot = i;
      } else {
         accTot = accumulator.apply(i, accTot);
      }
      return accTot;
   });
}
{% endhighlight %}

If you try to compile this code you'll see it runs into the same problem noted in [a previous article]({% post_url 2014-10-01-java-lambda-nested-functions%}), which is to say the variable accTot can't be referenced in the lambda expression unless you make it final, in which case you can't modify it.  Since this keeps coming up I'm going to bite the bullet and make a helper class:

{% highlight java %}

/**
 * This is a convenience class to allow a mutable (non-final) reference in
 * an inner class/lambda
 * 
 * @param <T> the value
 */
public static class StreamRef<T> {
   public T val;
   public StreamRef(T aVal) {
      val = aVal;
   }
}

 /**
  * Produces the intermediate results from a "reduce" operation
  */
public static <T> Stream<T> reductions(Stream<T> input, BinaryOperator<T> accumulator) {
   final StreamRef<T> accTot = new StreamRef<T>(null);
   return input.map(i -> {
      if (accTot.val == null) {
         accTot.val = i;
      } else {
         accTot.val = accumulator.apply(i, accTot.val);
      }
      return accTot.val;
   });
}
{% endhighlight %}

# Conclusion

I've found this both encouraging and disappointing.  The good news is the reductions method is not hard to write and looks fairly reasonable.  A disappointing part is that it was impossible to reuse any of the code written for reduce.  Another aspect to this which [others have noted](http://java.dzone.com/articles/whats-wrong-java-8-part-ii): the function we wrote only works with Object types.  To handle an IntStream we need to write another reductions function with a new signature.  

{% highlight java %}

public static class IntStreamRef {
   public int val;
   public boolean empty = true;

   public IntStreamRef(aVal) {
      val = aVal;
      empty = false;
   }
}

public static class BooleanStreamRef {
   public boolean val;

   public BooleanStreamRef(boolean aVal) {
      val = aVal;
   }
}

/**
 * Produces the intermediate results from a "reduce" operation
 */
public static IntStream reductions(IntStream input, IntBinaryOperator accumulator) {
   final IntStreamRef accTot = new IntStreamRef(0);
   final BooleanStreamRef empty = new BooleanStreamRef(true);
   return input.map(i -> {
      if (empty.val) {
         accTot.val = i;
         accTot.empty = false;
      } else {
         accTot.val = accumulator.applyAsInt(i, accTot.val);
      }
      return accTot.val;
   });
}
{% endhighlight %}


Its not hard, but it leads to massive code bloat when all the primitive types are taken into account.  Note the need for a BooelanStreamRef because there is no way to reference a null int value (and I'll skip the customary rant about Java primitive types).  As a final note that I'll emphasize is that, while the internal implementations of the Java 8 Streams classes not very functional in that they often rely on side-effects, and the parts that are function appear to be designed conciously to prevent reuse.  This seems extremely miopic on the part of <del>Sun</del>Oracle and I may have more to say on this later.

I've included these methods into a StreamUtil library in [my github account](https://www.github.com/bendra/bendra-util) which I'll be adding to as I discover new things.  Part II coming soon!
