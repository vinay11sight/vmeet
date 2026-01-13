# <p align="center">Jitsi Meet</p>

Jitsi Meet is a set of Open Source projects which empower users to use and deploy
video conferencing platforms with state-of-the-art video quality and features.


Amongst others here are the main features Jitsi Meet offers:

* Support for all current browsers
* Mobile applications
* Web and native SDKs for integration
* HD audio and video
* Content sharing
* Raise hand and reactions
* Chat with private conversations
* Polls
* Virtual backgrounds

And many more!

## Using Jitsi Meet

Using Jitsi Meet is straightforward, as it's browser based. Head over to [meet.jit.si](https://meet.jit.si) and give it a try. It's scalable and free to use. All you need is a Google, Facebook or GitHub account in order to start a meeting. All browsers are supported!

Using mobile? No problem, you can either use your mobile web browser or our fully-featured
mobile apps:

| Android | Android (F-Droid) | iOS |
|:-:|:-:|:-:|
| [<img src="resources/img/google-play-badge.png" height="50">](https://play.google.com/store/apps/details?id=org.jitsi.meet) | [<img src="resources/img/f-droid-badge.png" height="50">](https://f-droid.org/packages/org.jitsi.meet/) | [<img src="resources/img/appstore-badge.png" height="50">](https://itunes.apple.com/us/app/jitsi-meet/id1165103905) |

If you are feeling adventurous and want to get an early scoop of the features as they are being
developed you can also sign up for our open beta testing here:

* [Android](https://play.google.com/apps/testing/org.jitsi.meet)
* [iOS](https://testflight.apple.com/join/isy6ja7S)

## Running your own instance

If you'd like to run your own Jitsi Meet installation head over to the [handbook](https://jitsi.github.io/handbook/docs/devops-guide/) to get started.

We provide Debian packages and a comprehensive Docker setup to make deployments as simple as possible.
Advanced users also have the possibility of building all the components from source.

You can check the latest releases [here](https://jitsi.github.io/handbook/docs/releases).


## Documentation

All the Jitsi Meet documentation is available in [the handbook](https://jitsi.github.io/handbook/).

## Steps to build jitsi android sdk (mac)

1. Mac or Linux system required to build jitsi-meet 
2. Install npm
3. May be need to install Homebrew ( /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)") 
4. jq (brew install jq)
5. realpath (brew install coreutils)
6. maven (brew install maven)
7. openjdk 11
8. create the local.properties under android to set the android sdk and open jdk paths, File contents should be like this.
   <br />
   # android sdk path
   <br />
   sdk.dir=/Users/vinay/Library/Android/sdk
   <br />
   # jdk path
   <br />
   org.gradle.java.home=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home
   <br />
   
9. (1) install the dependenies <b>npm install</b> <br />
   (2) execute the build command <b>./android/scripts/release-sdk.sh /Users/vinay/workspace/11sight-android-sdk/jitsi </b> 
   
10. follow the developer guide https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-android-sdk/#build-and-use-your-own-sdk-artifactsbinaries
11. if you face : java.lang.IllegalArgumentException: Invalid notification (no valid small icon)
 <br />
<b>Solution :</b>
 <br />
(1) Right click on res folder in android project and choose image asset from new section.
 <br />
(2) Create icon with following config
 <br />
&emsp;<b>Name:</b> ic_notification
<br />
&emsp;<b>Icon Type:  </b>Notification Icons

<br />
<br />






