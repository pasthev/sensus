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
