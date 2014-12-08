---
layout: post
title:  "Functional Programing in Java 8 vs Java 7"
date:   2014-12-07 22:35:15
categories: java lambda stream
---

#Functional Programing, JDK 1.7 and before
Java had essentially no built-in support for functional programing prior to vers(:ion 8.  Several libraries do exist which attempt to provide some degree of support for functional constructs anyway; these include [Functional Java](http://www.functionaljava.org/), [Lambdaj](https://code.google.com/p/lambdaj/), and [guava](https://code.google.com/p/guava-libraries/).

These libraries are not very satisfactory and I expect they will fall out of favor as adoption of Java 8 picks up.  To illustrate just how unsatisfactory, consider this excerpt from guava's [functional documentation](https://code.google.com/p/guava-libraries/wiki/FunctionalExplained):

>Imperative code should be your default, your first choice as of Java 7. You should not use functional idioms unless you are absolutely sure of one of the following:

>1. Use of functional idioms will result in net savings of lines of code for your entire project [...]
>1. For efficiency, you need a lazily computed view of the transformed collection and cannot settle for an explicitly computed collection. Additionally, you have read and reread Effective Java, item 55, and besides following those instructions, you have actually done benchmarking to prove that this version is faster, and can cite numbers to prove it.
>Please be sure, when using Guava's functional utilities, that the traditional imperative way of doing things isn't more readable. Try writing it out. Was that so bad? Was that more readable than the preposterously awkward functional approach you were about to try?

#JDK 1.7 Functional code with Guava
The same documentation supplies code for comparison.  The iterative version:
{% highlight java %}
Multiset<Integer> lengths = HashMultiset.create();
for (String string : strings) {
  if (CharMatcher.JAVA_UPPER_CASE.matchesAllOf(string)) {
    lengths.add(string.length());
  }
}
{% endhighlight %}

Now the same code written with Guava's functional classes:
{% highlight java %}
Function<String, Integer> lengthFunction = new Function<String, Integer>() {
  public Integer apply(String string) {
    return string.length();
  }
};
Predicate<String> allCaps = new Predicate<String>() {
  public boolean apply(String string) {
    return CharMatcher.JAVA_UPPER_CASE.matchesAllOf(string);
  }
};
Multiset<Integer> lengths = HashMultiset.create(
  Iterables.transform(Iterables.filter(strings, allCaps), lengthFunction));
{% endhighlight %}

If those are the choices you have I think I agree that the first should be preferred!

#Java 8 version
The same code can be written using Java 8 Lambdas:

{% highlight java %}
Multiset<Integer> lengths = HashMultiset.create();
Arrays.stream(strings)
   .filter(s -> CharMatcher.JAVA_UPPER_CASE.matchesAllOf(s))
   .forEach(s -> lengths.add(s.length()));
{% endhighlight %}

Now this is the same number of lines as the iterative, and not obviously less readable (assuming the reader is familiar with functional programing idioms like filter).  Java 8 lambdas may be syntactic sugar, but they certainly succeed in sweetening the task in this case!
