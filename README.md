# sensus IR & RF codes converter / analyzer for Lirc, Pronto, Broadlink, Tuya, & raw codes with Impulses visualization


### ☞ [View & Use Sensus Online](https://pasthev.github.io/sensus/)
### ☞ [User Guide](#user_guide)


<div style="text-align: center;">
    <a href="https://pasthev.github.io/sensus/"><img src="screenshots/sensus_screenshot_03.jpg" width="600"></a >
</div>

---
Sensus is an online IR/RF code converting interface and framework.
The tool doesn't do as much as dedicated software (i.e. IRscrutinizer), but has the
advantage of being instantly available online.
Interface is easy to update with additional panels if needed - feel free to fork and
add your own protocols.

Short "thank you", positive or negative feedback always appreciated: use the [Discussions](https://github.com/pasthev/sensus/discussions) link above or this [anonymous contact form](https://docs.google.com/forms/d/e/1FAIpQLSckf2f04hYhTN3T6GvchbxhjhKcYHLMRDXnrRfqlM_eRW_NiA/viewform?usp=sf_link)

Bugs or Feature request? Us the [Issues](https://github.com/pasthev/sensus/issues) link.

---

## What Sensus IR & RF does

### Code conversion to and from:
* Lirc codes
* Pronto
* Graphic impulses
* Decimal
* Raw
* Broadlink hex (used in Jeedom)
* Broadlink Base 64 (Used in Home Assistant)
* Tuya Base 64
* ESP Home

### Frequency change
* Read or change frequency in Lirc / Pronto / Decimal / Raw frames
* Read or change IR / RF433 / RF315 in Brodalink Hex or Base 64 code

### Broadlink repeats change
* Read or change Broadlink repeats in Hex or B64

### Tuya conversion
* Many thanks to [@mildsunrise](https://gist.github.com/mildsunrise/1d576669b63a260d2cff35fda63ec0b5) who provided a Python solution for encoding Tuya sequences.

### Random IR / RF codes generation:
* Independant random codes generation in various formats
* Broadlink random codes generation, in Hex or B64 format:
  * Allows to pre-set Repeat values
  * Allows to pre-set Signal type (IR / RF433 / RF315)

### IR/RF frames analysis
* Frames decoding in detailled logged view
* Identification of Nec5 and One-Hot encoded payloads
* Identification of original Lirc command and possible manufacturer's code from raw frame
* Cleanup and re-generation of learnt IR/RF packets

### Impulses visualization
* Note that by default, the signal drawing is trimmed from its header since it is usually not physically sent, but rather an instruction for the device on how to send this sequence. As a convenience, clicking the *Draw* button within the Raw panel will force-display this header in the graphic representation.
* Note that if the sequence contains an odd number of signals, the last value will be trimmed in the graphic representation. This is to avoid the usually long trailer that has little interest, and would have the effect of changing the scale of the actual signal represented.

---
<div style="text-align: center;">
    <img src="screenshots/sensus_screenshot_01.jpg" width="600">
</div>

  
## Notes
### Code conversion to and from:
* Some values are slightly changed during conversion or frequency set. I.e. setting Header as "2512, 5520" in Commands panel, then converting to and back from Pronto results in Header becoming "2524, 5522"
  * this is intended, and due to the way values have to be stored in the various formats. In the example above, the converted "2524, 5522" header will remain stable no matter which format it is converted to.

### Frequency change
* Changing frequency in Pronto and Decimal panels only changes frequency info packet and not actual payload values:
  * this is intended, since both changing frequency and converting timecodes in payload would lead to the exact same result as changing nothing - same spirit as 2x(14 days) = 4x(1 week). For this reason, the only place where changing frequency will actually lead to a payload conversion is the Raw panel.
  
### Random IR / RF codes generation:  
* Broadlink random functions generate One-Hot sequences, mostly used for RF signals, while other random functions generate Nec sequences, usualy designed for IR signals. This should fit most use, but you can rely on the Convert functions if you need to swap these defaults, i.e.:  
  * To get a random Broadlink IR (Nec) sequence, generate a random Raw, then convert to Broadlink.  
  * To get a random Pronto RF (One-Hot) sequence, generate a random Broadlink, and convert to Pronto.

### IR/RF frames analysis
* The *Raw* Analysis panel acts both as a log window when needed, and as a raw analyzer through functions described below. Since this analysis is performed on the content of the Raw panel, all other formats must first be converted to Raw before running any of these analysis:
  * **Read raw**: Checks raw data for a binary sequence, and tries to decompose the signal. If succesful, result will be pushed to the *Command* panel.
    * *Header length* and *Trailer length* values define the number of beginning and ending values to force-ignore. These values are updated upon completion of the *Read Raw* function. 
  * **Check**: A simple feature throwing some info about the content of the *Raw* panel, which can be useful when analyzing an unknown signal. I.e. copy a long binary string, and *Check* function will count bits, convert values to decimal and hex, invert bits, etc. Copy a series of values, and *Check* function will count these values, search for repeat strings, etc.
  * **Repeats**: A strange and sometimes useful feature that will identify and remove the last occurrence of the longest repeated string found in *Raw* panel.
  
---

## About the code

*There are many other IR/RF standards that I just ignored here: so far I only added the ones I was facing, during my experiments with Home Assistant and Jeedom domotic solutions... But the html/css interface I'm providing makes it easy to add panels for other protocols, and the code should be documented enough for anyone to easily add components of their own, as well as new buttons to the Raw analysis interface when needed.*
 
*Both the Js, css and html code can certainly be improved. Happy to learn, so, forks welcome.*
*

<div style="text-align: center;">
    <img src="screenshots/sensus_screenshot_02.jpg" width="600">
</div>





## User Guide<a id="user_guide"></a>

*Guide d'utilisation en français [ici](README_FR.md)*

Topics covered in this guide:
* [Analyzing a captured IR frame with Sample Data](#sample)
* [Removing repetitions in an IR or RF sequence](#remove)
* [Bits stories: Explanation of the NEC protocol](#bits)
* [Converting LIRC, or Short Codes, to Broadlink, Tuya, Pronto, and other codes](#lirc)
* [Reminders about Sensus functions](#tips)
---

# Sensus - User Guide

Well, I'm going to start this documentation in the worst possible way, with a series of eye-straining numbers, so I'll add an image to brighten things up...

![image](screenshots/remote.png)

## Sample data<a id="sample"></a>

Here's an example of an awful Raw, in which the signal was recorded as received multiple times (as long as the user pressed the button during learning), and interrupted midway:
```
9041, 4524, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 602, 550, 550, 550, 550, 550, 1722, 550, 550, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 1722, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 1722, 550, 40362, 9028, 4532, 548, 548, 548, 1725, 548, 1725, 548, 1725, 548, 602, 548, 1725, 548, 1725, 548, 548, 548, 1725, 548, 548, 548, 548, 548, 602, 548, 1725, 548, 548, 548, 602, 548, 1725, 548, 1725, 548, 1725, 548, 548, 548, 1725, 548, 602, 548, 548, 548, 548, 548, 548, 548, 602, 548, 548, 548, 1725, 548, 548, 548, 1725, 548, 1725, 548, 1725, 548, 1725, 548, 40332, 9033, 4545, 552, 552, 552, 1719, 552, 1719, 552, 1719, 552, 607, 552, 1719, 552, 1719, 552, 552, 552, 1719, 552, 552, 552, 552, 552, 552, 552, 1719, 552, 552, 552, 607, 552, 1719, 552, 1719, 552, 1719, 552, 552, 552, 1719, 552, 552, 552, 552, 552, 552, 552, 552, 552, 552, 552, 552, 552, 1719, 552, 552, 552, 1719, 552, 1719, 552, 1719, 552, 1719, 552, 40345, 9034, 4528, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 608, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 1731, 542, 542, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 542, 542, 608, 542, 542, 542, 1731, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 1731, 542, 40384, 9030, 4528, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 606, 548, 1727, 548, 548, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 1727, 548, 40323, 9030, 4528, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 606, 548, 548, 548, 606, 548, 548, 548, 548, 548, 548, 548, 1727, 548, 606, 548, 1727, 548, 1727, 548, 1727, 548, 1727, 548, 40362, 9028, 4532, 548, 548, 548, 1725, 548, 1725, 548, 1725, 548, 602, 548, 1725, 548, 1725, 548, 548, 548, 1725, 548, 548, 548, 548, 548, 602, 548, 1725, 548, 548, 548, 602, 548, 1725, 548, 1725, 548, 1725, 548, 548, 548, 1725, 548, 602, 548, 548, 548, 548, 548, 548, 548, 602, 548, 548, 548, 1725, 548, 548, 548, 1725, 548, 1725, 548, 1725, 548, 1725, 548, 40345, 9034, 4528, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 608, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 1731, 542, 542, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 542, 542, 608, 542, 542, 542, 1731, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 1731, 542, 40384, 9030, 4528, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 606, 548, 1727, 548, 548, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 1727, 548, 40345, 9034, 4528, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 608, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 1731, 542, 542, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 542, 542, 1731, 542, 608, 542, 542, 542, 542, 542, 542, 542, 608, 542, 542, 542, 1731, 542, 542, 542, 1731, 542, 1731, 542, 1731, 542, 1731, 542, 40323, 9030, 4528, 548, 548, 548, 1727, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 1727, 548, 548, 548, 1727, 548, 548, 548, 548, 548, 548, 548, 1727, 548, 548
```
Copy it, then paste these values into Sensus's *Raw* field.
* Close the interface panels to keep only the ones you need - you can always reopen them using the purple toolbar at the top right.
* Don't click convert yet, but in the "Raw Analysis" panel, click "Read Raw":
* The signal is drawn, with its multiple repetitions. We can see that it is repeated ten times, with a tail of an unfinished signal.


![image](screenshots/sensusManual01.jpg)

The command is displayed, highlighted here in yellow: `7689 d02f`.

* Obviously, it is encoded following the NEC protocol, since the program was able to deduce the "*short*": `6e0b`. This is NEC Standard, with the address on a single byte, it should be read: "*Send to device #6e command 0b*", or, in decimal: "*Send to device #110 command 11*".
  ** Note that the initial intent of the first byte being the device address is long gone: except for the first 256 devices that have been registered with this standard, we should now rather consider the whole "*Short*" as a command.

* The header ("**Header**", here in red), has been identified: `9041, 4524`. A long high, followed by a low half its length - standard too.

* The **Zero** (in white) and the **One** (dark blue) have been calculated at their average values, respectively `550, 550`, and `550, 1727` (the second value for encoding the *One* is triple the first, this is again a common standard).

* As long as a remote control button is held down, it sends the signal, but each time marking a pause between two: the "**Repeat Signal**", which is generally the same as the end-of-sequence signal, the "**Gap**". This one is often the sum value  of the entire signal. I have indicated the first *Repeat* in green, the second in light blue: `40362`, and `40332`. The value should rather be around 54004 here, but it doesn't matter: the essential is to send a long white, and the durations are expressed in μs - so we are talking here about a pause of 0.04 or 0.05 seconds.
  * Sensus did not record this value as "**Gap**" in the top field: it is wary, because the *Gap* is expected at the end of the signal, but perhaps I should make it less wary, because we will later use this repeat value as *Gap*.

* The "**Ptrail**" is a short "*half Zero*" sent after the command, just before the *Repeat* or *Gap*. It is used to indicate the unit length, and to make the value sequence even, to ensure that the Gap is interpreted as a silence. The Ptrail was not spotted here by Sensus, I don't know why - maybe because of the unfinished tail - but it will be in due time.


## Removing repetitions<a id="remove"></a>

We have everything we need to either clean the sequence, or re-generate it from the values identified in the "**Commands**" panel - the missing values being `Ptrail: 550` (a half Zero), and `Gap: 40350` (or `54554`, which is the sum of the command values, excluding the *Ptrail*, if you want perfect balancing)

### Cleaning:

The method is simple. We start by removing from the Raw all the values after the first Repeat (which will conveniently become our end-of-sequence *Gap*). This leaves only the following sequence in the Raw field:

```
9041, 4524, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 602, 550, 550, 550, 550, 550, 1722, 550, 550, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 550, 550, 1722, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 550, 1722, 550, 550, 550, 1722, 550, 1722, 550, 1722, 550, 1722, 550, 40362
```
* Do it, then click again in the "**Raw Analysis**" panel on "**Read Raw**".
* In the "**Raw**" panel, click on "**Draw**".
* You now have a clean signal, a unique command and short, which have the same values as those initially repeated:

![image](screenshots/sensusManual02.jpg)

* Note that this time, the **Ptrail** and the **Gap** are identified: `550` and `40362`.
* As is, the signal has every chance of working, but note that in some standards requiring balancing, `40362` should be replaced by `54004`, which is the sum of the signal values. But since the value `40350` was recorded, it's best to keep it.

Add this number manually in Raw, then click on "**Draw**": the signal is displayed, with its Gap, ready to be converted into the desired format.





## Interlude: bit stories<a id="bits"></a>
Before seeing the other cleaning method, let's have a look at Raw Analysis. By scrolling to the bottom of the analysis, you can see these values:

```
Binary: *00010101000101000100000001000001010100010000000000000100010101010*
> Nec encoding detected  with shift value: 0/1 *01110110 10001001 + 11010000 00101111* - hex: *** 7689 d02f *** - short: < 6e0b > 
```

Explanation:

* The "*Binary*" line displays the Raw values converted plainly into 0 and 1.
* The "*with shift value*" line reads these bits (the "**bibits**") in pairs, here encoded 00=0 & 01=1, which is not always the case.
* The "*hex*" line displays these values in hexadecimal: 01110110 in binary is written 76 in hexadecimal, or 110 in decimal.


```
  550,  550,  550, 1722,  550, 1722,  550, 1722,  550,  550,  550, 1722,  550, 1722,  550,  550,  550, 1722,  550,  602...
   0     0     0     1     0     1     0     1     0     0     0     1     0     1     0     0     0     1     0     0...
|     0     |     1     |     1     |     1     |     0     |     1     |     1     |     0     |     1     |     0     |...
|                                             HEX 76                                            |                  HEX 89...
```

Reading the "**Short**" command in the NEC sequence `7689 d02f`:

`550` and `1722` are pulse and silence durations to be emitted. This means that sending a `0` here requires `550+550=1100 μs` and a `1`, `550+1722=2272μs`, which is more than double.

In fact, sending `11111111` would take, on this tiny scale, much more time than sending `00000000`, and the interpretation of signals with variable durations would be less precise, and prone to misinterpretation errors.

The solution? Always send a value and its binary inverse. Thus, the signal length becomes constant, and you have a reread value to check for proper reception.

Thus, if we consider the emitted sequence:
```
01110110 10001001 + 11010000 00101111
```

Placed one above the other, the values are indeed inverses:
```
01110110 - 11010000 
10001001 - 00101111
```

The check being conclusive, we remove the second line, to take only the first:
```
01110110 - 11010000
```

These two bytes are encoded in LSB First, meaning the least significant value first, as if we were writing `1234` > `4321`. So we flip each one horizontally: 
```
01110110 - 11010000
01101110 - 00001011
```
which is `6e - 0b`

This command is in the only format generally communicated by manufacturers - when they're kind enough to communicate their IR codes. It is also the format used by **LIRC**, and there are many online databases, such as the [LIRC Remotes Databases](https://lirc-remotes.sourceforge.net/remotes-table.html).

Thus, if we browse this [LIRC table](https://lirc-remotes.sourceforge.net/remotes-table.html) and click for example [samsung/0070-63.lircd.conf](https://sourceforge.net/p/lirc-remotes/code/ci/master/tree/remotes/samsung/0070-63.lircd.conf), we rediscover all the values that have been discussed here.

The "**Shorts**" are in the begin codes category:

```
begin codes :
          KEY_POWER                0x00000000000040BF        #  Was: Power
          D.Trk                    0x000000000000847B
          Input                    0x00000000000024DB
          KEY_KPPLUS               0x000000000000649B        #  Was: +
          KEY_KPMINUS              0x00000000000014EB        #  Was: -
```
`0x` indicates a hexadecimal notation, and all the 00s on the left are as useful as saying "*I'm cold, it's 000000015° in my living room!*: we remove them, and we discover that to turn on this Samsung TV, you have to send it the short code `40bf`.
* If necessary, Sensus allows you to quickly convert a *Short* to a command, and vice versa: it's not useful here, but enter the *Short* at the top left, click the arrow that goes to the right, you will get the result of the inversion and LSB conversion at the top right: `02fd fd02` for `40bf`.

The LIRC page contains the info to enter in the "Commands" panel of Sensus:

```
  header       4635  4332
  one           656  1562
  zero          656   445
  ptrail        656
  pre_data_bits   16
  pre_data       0xA0A0
  gap          47917
  toggle_bit      0
```
Where all this becomes really interesting for home automation is that by searching, you can find on the Web the famous secret codes, the "**Discrete Codes**", which contain sequences that the TV for example can recognize, while there is no equivalent button on its remote control.

For example, for my TV (*yes, I have an old TV, I'm a bit technophobic*):

```
begin remote

  name  Samsung_BN59-00937A
  bits            16
  flags    SPACE_ENC|CONST_LENGTH
  eps             30
  aeps           100
  header        4605  4344
  one            678  1551
  zero           678   436
  ptrail         679
  pre_data_bits   16
  pre_data    0xE0E0
  gap         107626
  toggle_bit_mask 0x0

      begin codes
          TV1_Power                0x40BF                    #  Was: Power
          TV1_PowerOff             0x19E6                    #  Was: Power Off
          TV1_PowerOn              0x9966                    #  Was: Power On
          TV1_VolumeUp             0xE01F                    #  Was: Vol+
```
`40BF` is the button that works as an On/Off toggle on my remote. But if I want to program Jeedom or Home-Assistant for remote shutdown or automated power-on via my Tuya, Broadlink or other IR transmitter, I send `19E6`, I'm sure to turn it off, and with `9966`, I can send the code twice by mistake, the TV will remain on.

Armed with all this, let's get back to our initial signal. We have seen how to "clean" it, but since we have extracted everything we wanted to know - the equivalent of the LIRC info - as an alternative we can also generate it from scratch, using the info that we have recovered in the *Commands* panel:

```
  header        9041, 4524
  one            551, 1722
  zero           551, 551
  ptrail         550
  gap          45000

  Code "Short"  6e0b
```

## Generating a sequence from LIRC info<a id="lirc"></a>
All that remains is to enter the appropriate values in the *Sensus* Commands panel, and click "**Convert**" in the Commands panel.

![image](screenshots/sensusManual03.jpg)

## A few points to know:<a id="tips"></a>
* When you enter a Raw in Sensus and click on **Convert**, the Raw values are adjusted for maximum compatibility with other protocols. These changes of a few microseconds will not affect your signal, whether it is IR or RF.

* As soon as a frequency is entered, it is displayed encoded in the Raw sequence, in the form of a four-value header: the first two contain the frequency, the next ones the number of command values in the sequence. These are not of much use in a Raw, but they do not affect the emitted signal. Note that I have chosen by default to exclude these useless values from the graphical display when you click on "**Convert**". But I have programmed the "**Draw**" button to display it, if you want to see the exact signal.


* To indicate the frequency in Hertz, you can either:
  * Click the desired frequency button in the *Commands* panel.
  * Enter it directly in the corresponding field.
  * A white arrow appears in the field when it is empty, giving access to a drop-down menu with the common frequencies.

![image](screenshots/sensusManual04.jpg)


**[Pasthev 2025](https://pasthev.github.io/)**

---
_Feedback / Questions / Small thank you: Use the [Discussions](https://github.com/pasthev/sensus/discussions) link above, or contact me via my [anonymous contact form](https://docs.google.com/forms/d/e/1FAIpQLSckf2f04hYhTN3T6GvchbxhjhKcYHLMRDXnrRfqlM_eRW_NiA/viewform?usp=sf_link)_
