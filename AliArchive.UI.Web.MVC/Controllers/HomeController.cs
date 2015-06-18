﻿using AliArchive.Repository.EntityFramework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AliArchive.UI.Web.MVC.Controllers
{
    public class HomeController : Controller
    {
        //private IRepository _repository;
        
        public ActionResult Index()
        {
            //_repository = new AliRepository();

            ////DBContext
            //AliDBContext db = new AliDBContext();

            //var listOfFightsPlusActor = _repository.AllIncludingFights<Fight>(p => p.Actor).ToList();
            
            //return View(db.Fights.OrderByDescending(o => o.Date).ToList());

            return View();
        }

        [HttpGet]
        public ActionResult ProRecord()
        {
            ViewBag.Message = "Professional Record";

            return View();
        }

        [HttpGet]
        public ActionResult AmateurRecord()
        {
            ViewBag.Message = "Amateur Record";

            return View();
        }

        [HttpGet]
        public ActionResult ExhibitionRecord()
        {
            ViewBag.Message = "Exhibition Record";

            return View();
        }

        [HttpGet]
        public JsonResult JsonFights()
        {
            AliDBContext db = new AliDBContext();
            
            //example date pubdate: new Date('2014', '03','08')
            //datetime: new Date(2014, 11, 31, 21, 00, 00, 00)
            //ng time {{ program.datetime | date : 'h:mma'  }}
            //The link is used to create interactive directives that respond to user actions.

            var queryFights = from c in db.Fights
                              orderby c.Date descending
                              select new
                              {
                                  FightID = c.FightID,
                                  Date = new { c.Date.Year, c.Date.Month, c.Date.Day },
                                  AlisWeight = c.AlisWeight,
                                  OpponentsWeight = c.OpponentsWeight,
                                  OpponentFirstName = c.Actor1.FirstName,
                                  Alias = c.Alias,
                                  Odds = c.BettingOdds,
                                  OpponentSecondName = c.Actor1.SecondName,
                                  WonInRound = c.WonInRound,
                                  StoppageTime = c.StoppageTime.ToString(),
                                  Rounds = c.Rounds,
                                  RefScore = c.RefScore,
                                  Result = c.Result,
                                  RefereeFirstName = c.Actor2.FirstName ?? "",
                                  RefereeSecondName = c.Actor2.SecondName ?? "",
                                  JudgeFirst = c.MatchJudges.Select(j=>j.Actor.FirstName),
                                  JudgeSecond = c.MatchJudges.Select(j => j.Actor.SecondName),
                                  JudgeScore = c.MatchJudges.Select(js=>js.Score),
                                  Belts = c.Belts.Select(m=>m.BeltAbbreviation),
                                  PromoterFirst = c.Actor.FirstName ?? "",
                                  PromoterSecond = c.Actor.SecondName ?? "",
                                  Venue = c.Venue.VenueName,
                                  City = c.City.Name,
                                  State = c.State.Name ?? "",
                                  Country = c.Country.CountryName,
                                  USAudience = c.USAudience,
                                  WorldAudience = c.WorlwideAudience,
                                  NumberBroadcastCountries = c.NumberOfBroadcastCountries,
                                  NumberClosedCircuitUS = c.NumberUSClosedCircuitLocation,
                                  LiveGate = c.LiveGate,
                                  Attendence = c.Attendence,
                                  AliPurse = c.AliPurse,
                                  AliPercentage = c.AliPercentageOfReceipts.HasValue ? "+" + c.AliPercentageOfReceipts + "%" : null,
                                  OpponentPurse = c.OpponentPurse,
                                  OpponentPercentage = c.OpponentPercentageOfReceipts.HasValue ? "+" + c.OpponentPercentageOfReceipts + "%" : null,
                                  Show = true
                              };
            
            return Json(
                queryFights
            , JsonRequestBehavior.AllowGet);
        }
        
        [HttpGet]
        public JsonResult JsonAmateurFights()
        {
            AliDBContext db = new AliDBContext();

            var queryFights = from c in db.AmateurFights
                              orderby c.Year descending
                              select new
                              {
                                  FightID = c.AmateurFightID,
                                  Year = c.Year,
                                  OpponentFirstName = c.Actor.FirstName,
                                  OpponentSecondName = c.Actor.SecondName,
                                  WonInRound = c.WonInRound,
                                  StoppageTime = c.StoppageTime.ToString(),
                                  Rounds = c.Rounds,
                                  Result = c.Result,
                                  Venue = c.Venue.VenueName,
                                  City = c.City.Name,
                                  State = c.State.Name,
                                  Country = c.Country.CountryName,
                              };

            return Json(
                queryFights
            , JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult JsonExhibitionFights()
        {
            AliDBContext db = new AliDBContext();

            var queryFights = from c in db.ExibitionFights
                              orderby c.Date descending
                              select new
                              {
                                  FightID = c.ExibitionFightID,
                                  Date = c.Date,
                                  OpponentFirstName = c.Actor.FirstName,
                                  OpponentSecondName = c.Actor.SecondName,
                                  Rounds = c.Rounds,
                                  Venue = c.Venue.VenueName,
                                  City = c.City.Name,
                                  State = c.State.Name,
                                  Country = c.Country.CountryName,
                              };

            return Json(
                queryFights
            , JsonRequestBehavior.AllowGet);
        }

        public ActionResult About()
        {
            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        
        public ActionResult Angular()
        {
            ViewBag.Message = "Your angular page.";

            return View();
        }

        public ActionResult ngbootstrap()
        {
            return View();
        }
    }
}