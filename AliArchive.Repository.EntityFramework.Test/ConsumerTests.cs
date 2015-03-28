using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Diagnostics;
using System.Linq;

namespace AliArchive.Repository.EntityFramework.Test
{
    [TestClass]
    public class ComsumerTests
    {
        private IRepository _repository;
        
        [TestInitialize]
        public void Initialise()
        {
            _repository = new AliRepository();
        }

        [TestMethod]
        public void Query_AllActors_NoException()
        {
            var list = _repository.All<Actor>().ToList();

            foreach (var item in list)
            {
                
                Trace.TraceInformation("Actor name : {0}", item.FirstName + " " + item.SecondName);
                Trace.TraceInformation("Fight : {0}", item.Fights.Select(p=>p.Venue.VenueName));
            }
        }

        [TestMethod]
        public void Query_AllActorsIncludingFights_NoException()
        {
            var list = _repository.AllIncludingFights<Actor>(p=>p.Fights).ToList();

            foreach (var item in list)
            {
                Trace.TraceInformation("Title : {0}", item.Title !=null ? item.Title.Title1 : "" + item.FirstName + " " + item.SecondName);
            }
        }

        [TestMethod]
        public void Query_AllFightsIncludingActors_NoException()
        {
            var list = _repository.AllIncludingFights<Fight>(p=>p.Actor).ToList();

            foreach (var item in list)
            {
                Trace.TraceInformation("Fight Date : {0}", item.Date);
                Trace.TraceInformation("Fighter Name : {0}", item.Actor.FirstName + " " + item.Actor.SecondName);

            }
        }

        //Efficient Query
        [TestMethod]
        public void Query_AllFightsIncludingActorsSelectDataAndName_NoException()
        {
            var list = _repository.AllIncludingFights<Fight>().Select(s => new { s.Date, s.Actor.FirstName, s.Actor.SecondName }).ToList();

            foreach (var item in list)
            {
                Trace.TraceInformation("Fight Date : {0}", item.Date);
                Trace.TraceInformation("Fighter Name : {0}", item.FirstName + " " + item.SecondName);

            }
        }

        [TestMethod]
        public void Query_AllFights_NoException()
        {
            var list = _repository.AllFights<Fight>().ToList();

            foreach (var item in list)
            {
                Trace.TraceInformation("DOB {0}", item.Actor1);
                Trace.TraceInformation("State {0}", item.State != null ? item.State.Name : "");
                Trace.TraceInformation("Opponent Weight {0}", item.OpponentsWeight);
            }
        }
    }
}
