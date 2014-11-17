---
layout: post
title:  "Fun with Java 8 Streams, Part II"
date:   2014-11-01 22:35:15
categories: java lambda stream
---

#Streams in Java 8
This is a continuation of [my investigation]({% post_url 2014-10-28-fun-with-java-8-streams %}) into the Java 8 stream API. As noted in my earlier article, the problems addressed here are actually part of a larger web project but in this article I'm focusing on the code itself and not the application.

#Streaming an Array/Collection
Again, I won't attempt to give anything like an introduction or overview of the Stream API as this has already been done [elsewhere](http://winterbe.com/posts/2014/07/31/java8-stream-tutorial-examples/).  For our purpose I'll just note that the Java 8 class libraries provide a facility for producing Streams from an array or Collection source:

Class java.util.Arrays
{% highlight java %}

    /**
     * Returns a sequential Stream with the specified array as its
     * source.
     *
     * @param <T> The type of the array elements
     * @param array The array, assumed to be unmodified during use
     * @return a {@code Stream} for the array
     * @since 1.8
     */
    public static <T> Stream<T> stream(T[] array) {
        return stream(array, 0, array.length);
    }
{% endhighlight %}

Class java.util.Collection
{% highlight java %}

    /**
     * Returns a sequential Stream with this collection as its source.
     * [skipping some details about how/when to override]
     *
     * @implSpec
     * The default implementation creates a sequential Stream from the
     * collection's Spliterator.
     *
     * @return a sequential Stream over the elements in this collection
     * @since 1.8
     */ 
    default Stream<E> stream() {
        return StreamSupport.stream(spliterator(), false);
    }
{% endhighlight %}

As usual there are cavats; the Arrays.stream() method is overloaded to deal with primitive types but the code is pretty easy to use as we saw in [part I]({post_url 2014-10-28-fun-with-java-8-streams}). But we'll leave that to one side for now. 

#Changing the streaming order

As you might expect, streaming an array (or an ArrayList) results in a stream of elements starting with the first element and ending with the last one. From the java.util.stream package documentation:

*Streams may or may not have a defined encounter order. Whether or not a stream has an encounter order depends on the source and the intermediate operations. Certain stream sources (such as List or arrays) are intrinsically ordered, whereas others (such as HashSet) are not.*

What if we want to stream in reverse order? One possiblity of course is to just reorder the collection; e.g. using Apache Commons:

{% highlight java %}
Integer data = {1, 2, 3};
ArrayUtils.reverse(data);
Stream<Integer> myStream = Arrays.stream(data);
{% endhighlight %}

Reversing an array in this way is an O(n) operation, which won't change the "Big O" complexity of a function using it since Stream operations are, by their nature, going to be O(n) or worse in general.  However it could make a performance difference for some applications and anyway its annoying and shouldn't be neccesary.  It's also distructive in that it modifies the original array.  Is there a better way?

#Implementing Stream in Reverse - Arrays

Once again we are going to write a static method to achieve what we are trying to do; we can't add a method to Collection and Arrays in Java don't have methods at all!  We'll turn to Collections later; here is the method signature for an array:

{% highlight java %}

/**
 * Stream elements in reverse-index order
 * 
 * @param input
 * @return a stream of the elements in reverse
 */
public static <T> Stream<T> streamInReverse(T[] input) 

{% endhighlight %}

The Arrays class implementation of stream() relies on the class java.util.Spliterators$ArraySpliterator, which is package-visable and final (a pattern which I've [seen before]({% post_url 2014-10-28-fun-with-java-8-streams %})).  So we'll have to come up with our own solution. 

We can do this by

1 Generating a sequential stream of numbers, one for each element in the array, and

2 Mapping that sequence to array indexes, descending:

{% highlight java %}

/**
 * Stream elements in reverse-index order
 * 
 * @param input
 * @return a stream of the elements in reverse
 */
public static <T> Stream<T> streamInReverse(T[] input) {
  return IntStream.range(1, input.length + 1).mapToObj(
    i -> input[input.length - i]);
}

{% endhighlight %}

Note the mapToObj function to convert the IntStream to an object reference stream - this is the sort of thing Java developers will have to get used to.

#Implementing Streams in reverse - Lists

The same technique from above can be used to stream a List in reverse; however there are significant performance considerations that have to be taken into account.  There are many different types of Lists in java; principally:

1 ArrayList/Vector - List backed by an array.  The same technique used for Arrays will work just fine.

2 LinkedList - Doubly-linked list data structure.  Because get-by-index is itself an O(n) operation, the implementation above will have O(n^2) performance, which is not acceptable.  You'd be better off reversing the list and streaming sequentially.

Because LinkedList is double-linked, we can use a ListIterator to process the elements sequentially in either direction in constant time for each element.  LinkedList even provides a convenient descendingIterator() method to do just that.  There's no way to create a Stream directly using an Iteratory, which I found surprising.  Instead you have to go through a static method in StreamSupport using a *Spliterator*.  A Spliterator is essentially an Iterator with some added capabilitites for Streams; the name Spliterator refers to the fact that one of these capabilities is a method to split of a chunk of a stream for another thread to process.

If you want to learn more about Spliterators try [this post](http://stackoverflow.com/questions/19235606/understanding-spliterator-collector-and-stream-in-java-8); here I'll just note that there is a natural and convenient static method in class Splitterators for converting our ordered, sequential iterator into an ordered, sequential Spliterator. We can use this to process a LinkedList in reverse:

{% highlight java %}

/**
 * Stream elements in reverse-index order
 * 
 * @param input
 * @return a stream of the elements in reverse
 */
private static <T> Stream<T> streamInReverse(LinkedList<T> input) {
  final Iterator<T> descendingIterator = input.descendingIterator();
  return StreamSupport.stream(Spliterators.spliteratorUnknownSize(
    descendingIterator, Spliterator.ORDERED), false);
}

{% endhighlight %}

Combining the two techniques gives us the ability to choose an appropriate function for the List type:

{% highlight java %}

/**
 * Stream elements in reverse-index order
 * 
 * @param input
 * @return a stream of the elements in reverse
 */
public static <T> Stream<T> streamInReverse(List<T> input) {
  if (input instanceof LinkedList<?>) {
    return streamInReverse((LinkedList<T>) input);
  }
  return IntStream.range(1, input.size() + 1).mapToObj(
    i -> input.get(input.size() - 1));
}

/**
 * Stream elements in reverse-index order
 * 
 * @param input
 * @return a stream of the elements in reverse
 */
private static <T> Stream<T> streamInReverse(LinkedList<T> input) {
  final Iterator<T> descendingIterator = input.descendingIterator();
  return StreamSupport.stream(Spliterators.spliteratorUnknownSize(
    descendingIterator, Spliterator.ORDERED), false);
}

{% endhighlight %}

#Conclusion

The resulting code is pretty reasonable again.  A disappointing aspect is that I'm spending a lot more time solving Java problems than logic problems.  I'll have more to say about this later.
