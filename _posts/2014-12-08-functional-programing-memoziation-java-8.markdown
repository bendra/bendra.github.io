---
layout: post
title:  "Functional Programing in Java 8: Memoization"
date:   2014-12-08 22:38:15
categories: java lambda functional memoization guava
comments: true
---

#Caching and Performance
A very common strategy for increasing performance of any software system is to find a way to reduce the amount of work that it has to do by identifying expensive/time consuming operations and storing the results from them in a fast-lookup data structure.  Some common implementations of this are:

1. using a squid or varnish proxy to cache entire web requests
1. storing results from database queries in an in-memory data structure in your application (like hibernate's ehcache) 
1. storing the resutls of any expensive method/function call in a hashmap data structure, which you check before performing the calculation

As should be obvious, this type of optimization has the potential to quickly eliminate bottlenecks and vastly improve overall application performance.

This article will concentrate on the third technique above, of providing a way to store the results of expensive method calls. The general term for this is *memoization*.  Traditionally this goal has been achieved in Java through *internal memoziation*, which means that a method is changed internally, using an idiom like replacing the following code: 
{% highlight java %}

public String somethingExpensive(String input){
   //high cost operation
{% endhighlight %}

with something like:
{% highlight java %}

private Map<String, String> cache = new HashMap<String, String>();
public String somethingExpensive(String input){
  if( !cache.containsKey( input ) ){
     cache.put(input, doSomethingExpensive( input ));
  }
  return cache.get(input);
}


private String doSomethingExpensive(String input){
  //high cost operation - original function from above
{% endhighlight %}

#External Memoization
In contrast to this approach, most functional languages provide some facility for memoizing a function externally; that is to say, without changing the target function.  This is normally achieved by way of a memoize function which wrapps a target function; for example in clojure:

{% highlight lisp %}

(def something-sxpensive-memo
   (memoize something-expensive)) 
{% endhighlight %}

This returns a function with the same signature as something-expensive, but with memoization provided via a map of input-to-output values ([source here](https://github.com/clojure/clojure/blob/028af0e0b271aa558ea44780e5d951f4932c7842/src/clj/clojure/core.clj#L5834) if you are interested).  As you can see this is much simpler and less intrusive on your code than internal memoization, and can easily be added or removed from a function without the risk of introducing bugs into the target function itself.

#Memoization and Java 8
With Java 8, this approach is now available in Java through the java.util.function classes.  The implementation is quite simple:

{% highlight java %}
public static <T, R> Function<T, R> memoize(Function<T, R> fn) {
   Map<T, R> map = new ConcurrentHashMap<T, R>();
   return (t) -> map.computeIfAbsent(t, fn);
}
{% endhighlight %}

We are using a ConcurrentHashMap to prevent two threads from attempting to simultaniously compute the same input values.  Note the new method java.util.Map.computeIfAbsent which takes a function as its second argument - it was added specifically for this use case.

Now we can wrap our original method as such:

{% highlight java %}
public Function somethingExpensiveMemo(){
  return memoize((t) -> somethingExpensive(t));
}
{% endhighlight %}

This should go without saying, but somethingExpensive must be a pure function (no side effects) for this to work as expected; the reason for this is the target method will only be called once for each unique input value. Also of course it assumes only a single argument.  As we will see, it is easy to extend this technique to handle more arguments.

#Predicate
A java.util.function.Predicate is essentially a single-argument function which returns a boolean value; it also contains some convenience methods like negate() to create an inverse of a predicate, methods and()/or() to combine or junction two predicates.  It also has a different api than java.util.function.Function (test vs apply) and does not inherit from Function.  As a result there is some extra work we need to reuse the memoize approach above:
{% highlight java %}
public static <T> Predicate<T> memoizePred(Predicate<T> pred) {
   Function<T, Boolean> memo = memoize((t) -> pred.test(t));
   return (t) -> memo.apply(t);
}
{% endhighlight %}

Essentially, what we do is create a private (nested) function which returns a Boolean value, then memoize that function, and return a predicate which delegates to the wrapped function.

Now we can apply a memoized version of a predicate to a filter() function for example, like the guava example in my [last post]({% post_url 2014-12-07-functional-programing-java-8%}):

{% highlight java %}

Multiset<Integer> lengths = HashMultiset.create();
Arrays.stream(strings)
   .filter(s -> memoizePred(CharMatcher.JAVA_UPPER_CASE.matchesAllOf(s)))
   .forEach(s -> lengths.add(s.length()));
{% endhighlight %}
*EDIT: In this case the target function is itself fast and there is no need to memoize- this is just provided for illustration*

Note the new method is "memoizePred" instead of "memoize" because otherwise the compiler complains that the call is ambiguous.  I'm not sure why javac can't infer the type from the singature of the Stream.filter() function (especially considering how much help we usually get with lambda type inferencing), but there you have it.

#Multiple arguments
A Function with multiple arguments presents a different sort of problem, because the techniqe we are using relies on Map.computeIfAbsent() which assumes a single argument.  In addition, to do any sort of map lookup we'll need a single hash value based on all of the input values.

Fortunatley an easy solution is to build a list with the arguments and then use a helper function which takes one argument (the list).  This also solves the problem of hash value calculation because the list will automatically build us a composite hash value.

For a method with two arguments we have a predefined functional interface, java.util.function.BiFunction; for more arguments we might have to write a new functional interface but the technique will be analogous:

{% highlight java %}
public static <T, U, R> BiFunction<T, U, R> memoizeBifn(BiFunction<T, U, R> bFn) {
   @SuppressWarnings("unchecked")
   Function<List<? extends Object>, R> twoArgsListMemoFn = memoize(list -> bFn.apply(
      (T) list.get(0), (U) list.get(1)));
   
   return (t, u) -> {
      List<? extends Object> list = Arrays.asList(t, u);
      return twoArgsListMemoFn.apply(list);
   };
}
{% endhighlight %}

Note the neccesity of supressing warnings as the argument list may (and often will) contain different types.

Take the following example code for instance:
{% highlight java %}
public String twoArgs(String input, int i) {
   return "something expensive: " + input + ": " + i;
}
{% endhighlight %}

This can be memoized with the following:

{% highlight java %}
public BiFunction<String, Integer, String> twoArgsMemoBf() {
   return memoizeBiFn((t, u) -> twoArgs(t, u));
} 
{% endhighlight %}

#Conclusion
Java 8 requires developers to learn a whole new set of idioms to use effectively, but memoziation appears to be feasable under a wide variety of situations.  I've added the memoziation functions to my utility library (which I need to come up with a new name for now). 
