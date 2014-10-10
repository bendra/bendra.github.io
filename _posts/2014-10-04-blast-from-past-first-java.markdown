---
layout: post
title:  "Blast from the past: my first Java program"
date:   2014-10-04 22:35:15
categories: java applet
comments: true
---
#You have to start somewhere...
This is the very first Java application I wrote, anywhere.  Its also one of the first nontrivial programs I wrote in ANY programing language.  I need to clean up the code before I can throw it on GitHub without dying of embarassment, but I don't see why I can't post the resulting applet

#Applet, say what?
Believe it or not, applets (which now are just another kind of plug-in) were  supposed to be the original killer feature of Java.  Things have changed a lot since then, and you have to deal with code signing and anoying warning messages even if your app stays completely within the applet sandbox (as this one does).  I can only appologize for this.

#Ok, let's see it!
I thought you'd never ask!

<object type="application/x-java-applet" name="MissileCommander" width="500" height="435">
  <param name="archive" value="/resources/missileCommand.jar" />
  <param name="code" value="v2.MissileCommandApplet.class" />
</object>

#But wait, I can't run that!
Ok, you are probably using a recent version of Java.  As of Java 7 update 51, Oracle is [requiring](https://blogs.oracle.com/java-platform-group/entry/new_security_requirements_for_rias) that all applets be signed by a trusted party to run in the browser.  Period. And that means coughing up dough for a code signing key from a CA trusted by the JRE (which will expire if it is not periodically renewed).

#But what about the Java sandbox?  
The applet model specifies that applets are only allowed a limited set of functionality which prevents them from doing damage, unless the end user grants permissions to it.  It would appear that Oracle has decided that their sandbox can't be made secure enough, or don't want to spend tht time/money or deal with the liability of fixing it.  If you read the [comments](https://blogs.oracle.com/java-platform-group/entry/new_security_requirements_for_rias), plenty of people are none too pleased.

#Ok, so what to do? 
Well, if you like you can add http://bendra.github.io to your [Java Exceptions Site list](http://www.java.com/en/download/help/java_blocked.xml), but that's probably too much to ask.  I personally gave up on applets over a decade ago so I'm not paying.  Hoewever, I've written a runner class to allow you to run my first app as a standalone application using a self-executing Jar.  Dowlnoad it [here](/resources/MissileCommandRunner.jar), of course you will need a JRE.  Just download this file and run it with java -jar MissileCommandRunner.jar (you might be able to just click on it if you have your file associations right).
