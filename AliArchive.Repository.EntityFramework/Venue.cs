//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace AliArchive.Repository.EntityFramework
{
    using System;
    using System.Collections.Generic;
    
    public partial class Venue
    {
        public Venue()
        {
            this.AmateurFights = new HashSet<AmateurFight>();
            this.ExibitionFights = new HashSet<ExibitionFight>();
            this.Fights = new HashSet<Fight>();
        }
    
        public int VenueID { get; set; }
        public string VenueName { get; set; }
    
        public virtual ICollection<AmateurFight> AmateurFights { get; set; }
        public virtual ICollection<ExibitionFight> ExibitionFights { get; set; }
        public virtual ICollection<Fight> Fights { get; set; }
    }
}
