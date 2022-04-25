# sensus
 Sensus IR & RF Codes converter
**[View online](https://pasthev.github.io/sensus/)**

### Sensus IR & RF codes converter / analyzer for Lirc, Pronto, Broadlink & raw codes

A project to provide an online IR/RF code converting interface and framework.
The tool doesn't do as much as dedicated software (i.e. IRscrutinizer), but has the
advantage of being instantly available online.
Interface is easy to update with additional panels if needed - feel free to fork and
add your own protocols.


## What Sensus IR & RF does

### Code conversion to and from:
* Lirc codes
* Pronto
* Decimal
* Raw
* Broadlink hex (used in Jeedom)
* Broadlink Base 64 (Used in Home Assistant)

### Frequency change
* Read or change frequency in Lirc / Pronto / Decimal / Raw frames
* Read or change IR / RF433 / RF315 in Brodalink Hex or Base 64 code

### Broadlink repeats change
* Read or change Broadlink repeats in Hex or B64

### Random IR / RF codes generation:
* Independant random codes generation in various formats
* Broadlink random codes generation, in Hex or B64 format:
  * Allows to pre-set Repeat values
  * Allows to pre-set Signal type (IR / RF433 / RF315)

Note that Broadlink random functions generate One-Hot sequences, mostly used for RF signals,
while other random functions generate Nec sequences, usualy designed for IR signals.
This should fit most use, but you can rely on the Convert functions if you need to swap these
defaults, i.e.: 
To get a random Broadlink IR (Nec) sequence, generate a random Raw, then convert to Broadlink.
To get a random Pronto RF (One-Hot) sequence, generate a random Broadling, and convert to Pronto.

### IR/RF frames analysis
* Frames decoding in detailled logged view
* Identification of Nec5 and One-Hot encoded payloads
* Identification of original Lirc command and possible manufacturer's code from raw frame
* Cleanup and re-generation of learnt IR/RF packets

## About the code

There are many other IR/RF standards that I just ignored here: so far I only added the ones
I was facing, during my experiments with Home Assistant and Jeedom domotic solutions...
But the html/css interface I'm providing makes it easy to add panels for other protocols, 
and the code should be documented enough for anyone to easily add components of their own,
as well as new buttons to the Raw analysis interface when needed.
 
Both the Js, css and html code can certainly be improved. Happy to learn, so, forks welcome.

## Notes
* Changing frequency in Pronto and Decimal panels only changes frequency info packet and not actual payload values:
  * this is intended, since both changing frequency and converting timecodes in payload would lead to the exact same result as changing nothing - same spirit as 2x(14 days) = 4x(1 week). For this reason, the only place where changing frequency will actually lead to a payload conversion is the Raw panel.
* Some values are slightly changed during conversion or frequency set. I.e. setting Header as "2512, 5520" ir Commands panel, then converting to and back from Pronto results in Header becoming "2524, 5522"
  * this is intended, and due to the way values have to be stored in the various formats. In the example above, the converted "2524, 5522" header will remain stable no matter which format it is converted to.